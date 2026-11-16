import packageInfo from '@/package.json';

const REPOSITORY = 'https://github.com/wattnet/wattnet-dashboard';

// What the badge of the version shows. A release shows its version, the one of package.json that Release Please keeps. A snapshot (the image of
// a commit that the workflow Snapshot makes) is built with the commit in NEXT_PUBLIC_BUILD_COMMIT and shows that commit instead, which is what
// tells what is deployed: package.json says the version of the last release, whatever the commit is. The value is inlined when the page is
// built, so it has to be given to the build (the Dockerfile takes it as BUILD_COMMIT), and a value that is not a commit is ignored.
const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT;
const isCommit = !!commit && /^[0-9a-f]{7,40}$/.test(commit);

export const buildLabel = isCommit ? commit : `v${packageInfo.version}`;
export const buildHref = isCommit
  ? `${REPOSITORY}/commit/${commit}`
  : `${REPOSITORY}/releases`;
