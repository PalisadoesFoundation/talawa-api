import inquirer from 'inquirer';
import mongodb from 'mongodb'

//Checks if the data exists and ask for deletion
/**
 * The function `shouldWipeExistingData` checks if there is existing data in a MongoDB database and prompts the user to delete
 * it before importing new data.
 * @param url - The `url` parameter is a string that represents the connection URL for the
 * MongoDB database. It is used to establish a connection to the database using the `MongoClient` class
 * from the `mongodb` package.
 * @returns The function returns a Promise<boolean>.
 */
export async function shouldWipeExistingData(url: string): Promise<boolean> {
    let shouldImport = false;
    const client = new mongodb.MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    try {
      await client.connect();
      const db = client.db();
      const collections = await db.listCollections().toArray();
  
      if (collections.length > 0) {
        const { confirmDelete } = await inquirer.prompt({
          type: "confirm",
          name: "confirmDelete",
          message:
            "We found data in the database. Do you want to delete the existing data before importing?",
        });
  
        if (confirmDelete) {
          for (const collection of collections) {
            await db.collection(collection.name).deleteMany({});
          }
          console.log("All existing data has been deleted.");
          shouldImport = true;
        } else {
          console.log("Deletion & import operation cancelled.");
        }
      } else {
        shouldImport = true;
      }
    } catch (error) {
      console.error("Could not connect to database to check for data");
    }
    client.close();
    return shouldImport;
  }