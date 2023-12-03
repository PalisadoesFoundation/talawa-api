GRAPHQL_ENDPOINT="http://localhost:4000/graphql?query=%7B__typename%7D"
GRAPHQL_OUTPUT=$(curl -s $GRAPHQL_ENDPOINT)
echo "GraphQL Output: $GRAPHQL_OUTPUT"

# Check if the output contains the expected typename
echo $GRAPHQL_OUTPUT | jq '.data.__typename' | grep -q "Query"

# Exit with a non-zero status if the check fails
if [ $? -eq 0 ]; then
    echo "Graphql engine execution Passed!"
else
    echo "Graphql engine execution Failed!"
    exit 1
fi