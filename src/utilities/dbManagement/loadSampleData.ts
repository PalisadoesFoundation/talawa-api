import { populateDB,disconnect } from "./helpers";


export async function main() {
	try{
		await populateDB("interactive");
		await disconnect();
	}
	catch(error){
		console.log("Error: ",error);
	}
	
}

main();
