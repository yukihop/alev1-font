export default async function () {
  const { getAlevData, getManifestMeta } = await import('../../_config/alev.ts');

  return {
    ...getManifestMeta(),
    ...getAlevData(),
  };
}
