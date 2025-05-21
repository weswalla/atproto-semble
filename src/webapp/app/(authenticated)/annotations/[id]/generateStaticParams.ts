// This is a server component file
export function generateStaticParams() {
  // Return an empty array as we don't know all possible IDs at build time
  // This tells Next.js to generate the page at runtime
  return [];
}
