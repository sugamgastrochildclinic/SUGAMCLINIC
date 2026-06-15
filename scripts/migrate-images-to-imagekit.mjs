/**
 * One-time migration: move base64 `data:` image blobs out of MongoDB and into
 * ImageKit, replacing each field with the returned CDN URL.
 *
 * WHY: images were historically saved as inline base64 in the DB. `next/image`
 * cannot optimize `data:` URIs, so they shipped un-resized, un-compressed, and
 * inline in every page's HTML (megabytes per page, terrible LCP). After this
 * migration every image is a CDN URL that next/image serves as responsive
 * AVIF/WebP.
 *
 * SAFETY:
 *   - Idempotent: only touches fields whose value starts with "data:". Re-runs
 *     are no-ops once a field holds a URL.
 *   - Read-only for everything else.
 *   - Mutates LIVE data and uploads to an EXTERNAL CDN — back up the DB first
 *     and run with intent.
 *
 * RUN (Node 20.6+):
 *   node --env-file=.env scripts/migrate-images-to-imagekit.mjs
 *   node --env-file=.env scripts/migrate-images-to-imagekit.mjs --dry-run
 */
import mongoose from "mongoose";
import ImageKit from "imagekit";

const DRY_RUN = process.argv.includes("--dry-run");

const { MONGODB_URI, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } =
  process.env;

if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_URL_ENDPOINT)
  throw new Error("ImageKit env vars missing");

const ik = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});

// collection -> image-bearing fields
const TARGETS = {
  clinicsettings: ["logo", "favicon", "heroImage", "ogImage"],
  doctors: ["photo"],
  services: ["image"],
  blogposts: ["image"],
  reviews: ["photo"],
  galleries: ["imageUrl"],
};

const isData = (v) => typeof v === "string" && v.startsWith("data:");

async function uploadOne(dataUrl, fileName) {
  const res = await ik.upload({
    file: dataUrl,
    fileName,
    folder: "/sugam-clinic/migrated",
    useUniqueFileName: true,
  });
  return res.url;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  let migrated = 0;
  let scanned = 0;

  for (const [coll, fields] of Object.entries(TARGETS)) {
    const cursor = db.collection(coll).find({});
    for await (const doc of cursor) {
      scanned++;
      const updates = {};
      for (const field of fields) {
        if (isData(doc[field])) {
          const kb = Math.round((doc[field].length * 0.75) / 1024);
          console.log(`  ${coll}.${field} (${doc._id}) ~${kb}KB base64 -> uploading…`);
          if (!DRY_RUN) {
            updates[field] = await uploadOne(doc[field], `${coll}-${field}-${doc._id}`);
          }
          migrated++;
        }
      }
      if (!DRY_RUN && Object.keys(updates).length) {
        await db.collection(coll).updateOne({ _id: doc._id }, { $set: updates });
      }
    }
  }

  console.log(
    `\n${DRY_RUN ? "[DRY RUN] " : ""}Done. Scanned ${scanned} docs, ${migrated} base64 image field(s) ${
      DRY_RUN ? "would be" : ""
    } migrated.`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
