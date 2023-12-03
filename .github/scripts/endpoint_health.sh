HEALTH_CHECK_OUTPUT=$(curl -s http://localhost:4000/)
echo "Health Check Output: $HEALTH_CHECK_OUTPUT"
        
# Check if the status is "healthy" in the JSON response
echo $HEALTH_CHECK_OUTPUT | jq '.status' | grep -q "healthy"

# Exit with a non-zero status if the health check fails
if [ $? -eq 0 ]; then
    echo "Health Check Passed!"
else
    echo "Health Check Failed!"
    exit 1
fi