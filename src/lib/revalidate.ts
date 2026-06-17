import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Bust the ISR cache for every public, content-driven page after an admin
 * mutation. Content cross-pollinates across routes (clinic settings render in
 * the shared layout/footer; doctors/services/reviews/faqs all surface on the
 * homepage), so the safe, cheap move is to revalidate all public routes at once.
 *
 * This is what keeps admin edits *instant* for visitors even though the pages
 * are now statically cached (ISR `revalidate = 300`) instead of `force-dynamic`.
 */
export function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/gallery");
  revalidatePath("/blogs");
  // The shared layout (footer/navbar clinic info) reads settings through an
  // unstable_cache tagged "public-layout-settings". revalidatePath alone does
  // NOT clear that entry, so the footer would keep showing stale address/phone/
  // email/hours until the 300s TTL. Bust the tag too.
  revalidateTag("public-layout-settings");
}
