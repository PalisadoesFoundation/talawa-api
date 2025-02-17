import { getExpectedCounts, populateDB, disconnect,runValidation } from "./helpers";


export async function main() {
	try{
		const expectedCounts: Record<string, number> = await getExpectedCounts();
		await populateDB("test");
		await runValidation(expectedCounts);
		await disconnect();
	}
	catch(error){
		console.log("Error: ",error);
	}
}

main();
