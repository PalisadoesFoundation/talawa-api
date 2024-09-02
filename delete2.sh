export CHANGED_UNAUTH_FILES=".husky/pre-commit setup.ts"
for file in ${CHANGED_UNAUTH_FILES}; do
  echo "$file is unauthorized to change/delete"
done
exit 1