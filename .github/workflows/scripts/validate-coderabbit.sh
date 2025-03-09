#!/bin/bash

echo "Step 1: Fetching all PR reviews..."

check_approval() {

  echo "Debug: PR_NUMBER=$PR_NUMBER"
  echo "Debug: GITHUB_REPOSITORY=$GITHUB_REPOSITORY"
  echo "Debug: GITHUB_SHA=$GITHUB_SHA"
  echo ""


  response=$(curl -s -f -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/reviews?per_page=1000") || {
    echo "Error: Failed to fetch reviews from GitHub API"
    exit 1
  }

  echo "Debug: Raw API response from GitHub:"
  echo "$response"
  echo ""

  latest_reviews=$(echo "$response" | jq -c '[.[]]')

  if [ "$latest_reviews" = "null" ] || [ -z "$latest_reviews" ]; then
    echo "Error: Invalid reviews data"
    exit 1
  fi

  echo "Debug: Latest reviews JSON:"
  echo "$latest_reviews"
  echo ""

  echo "Step 2: Checking approval status of 'coderabbitai[bot]'..."

approval_state=$(
  echo "$latest_reviews" \
  | jq -r '[ .[] | select(.user.login == "coderabbitai[bot]" and .state == "APPROVED") ] | length'
)

  echo "Debug: Found $approval_state approvals from 'coderabbitai[bot]' for commit ID $GITHUB_SHA."
  echo ""

  # If approval_state is > 0, we have at least one matching approval
  if [[ "$approval_state" =~ ^[0-9]+$ ]] && [[ $approval_state -gt 0 ]]; then
    echo "Success: PR approved by CodeRabbit.ai for commit $GITHUB_SHA."
    return 0
  else
    return 1
  fi
}

# Number of times to retry and how many seconds to wait between retries
MAX_RETRIES=10
RETRY_DELAY=30
attempt=1

while [ $attempt -le $MAX_RETRIES ]; do
  if check_approval; then
    break
  fi

  if [ $attempt -eq $MAX_RETRIES ]; then
    echo "ERROR: Approval not found for commit $GITHUB_SHA after $attempt attempts."
    echo ""
    echo "1) This PR is not approved by CodeRabbit.ai for the latest commit."
    echo "2) If you need to re-trigger CodeRabbit.ai, comment the following on the PR:"
    echo ""
    echo "   @coderabbitai full review"
    echo ""
    exit 1
  fi

  echo "Attempt $attempt failed, retrying in $RETRY_DELAY seconds..."
  sleep $RETRY_DELAY
  attempt=$((attempt + 1))
done

echo "Step 3: PR approved by CodeRabbit.ai. Proceeding with the workflow..."
exit 0
