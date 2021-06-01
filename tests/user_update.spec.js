const axios = require("axios");
 const {URL} = require("../constants");
 const getToken = require("./functions/getToken");

 let token;
 beforeAll(async () => {
     token = await getToken();
 });

 describe("Update-Profile Resolvers", () => {
    test("updateProfile", async () => {
        const response = await axios.post(
            URL, {
                query: `
            mutation{
                updateUserProfile(data:{
                  firstName:"Test"
                  lastName:"Name"
                }){
                  firstName
                  lastName
                }
              }
                  `,
            }, {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            }
        );

        const { data } = response;
         if (!data.data) console.log("Data not present")
         expect(data.data.updateUserProfile).toEqual(
             expect.objectContaining({
                 firstName: "Test",
                 lastName: "Name",
             })
         );
     });
 }) 