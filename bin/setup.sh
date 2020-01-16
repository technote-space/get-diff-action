#!/usr/bin/env bash

set -e

rm -f .github/workflows/check_version.yml
rm -f .github/workflows/ci.yml
rm -f .github/workflows/gh_releases.yml
rm -f .github/workflows/issue_opened.yml
rm -f .github/workflows/pr_opened.yml
rm -f .github/workflows/pr_updated.yml
rm -f .github/workflows/project_card_moved.yml
rm -f .github/workflows/toc.yml

rm -f .github/card-labeler.yml
rm -f .github/config.yml
rm -f .github/labeler.yml
rm -f .github/no-response.yml
rm -f .github/pr-labeler.yml
rm -f .github/release-drafter.yml
rm -f .github/stale.yml

rm -rdf .github/ISSUE_TEMPLATE

rm -f .github/CODE_OF_CONDUCT.md
rm -f .github/CODEOWNERS
rm -f .github/CONTRIBUTING.md
rm -f .github/FUNDING.yml
rm -f .github/pull_request_template.md

rm -f _config.yml
rm -f README.md
touch README.md

sed -i '/COMMIT_NAME/d' .github/workflows/released.yml
sed -i '/COMMIT_EMAIL/d' .github/workflows/released.yml
sed -i '/OUTPUT_BUILD_INFO_FILENAME/d' .github/workflows/released.yml
sed -i '/TEST_TAG_PREFIX/d' .github/workflows/released.yml
sed -i '/ORIGINAL_TAG_PREFIX/d' .github/workflows/released.yml
sed -i '/\*\/\*/d' .github/workflows/released.yml
sed -i 's/test\/v1/v1/' .github/workflows/released.yml

sed -i '/setup.sh/d' package.json

cat << EOS
Please edit package.json
  - name
  - version
  - description
  - authoer
  - license
  - keywords
  - homepage
  - repository
  - bugs
EOS
