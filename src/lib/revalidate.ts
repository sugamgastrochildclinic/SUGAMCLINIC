import { revalidatePath } from "next/cache";

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
}
