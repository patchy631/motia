export default async function globalTeardown() {
  if (globalThis.__TEST_SERVER__) {
    await globalThis.__TEST_SERVER__.close()
  }
}
