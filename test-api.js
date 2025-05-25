const testAPI = async () => {
  const baseUrl = "http://localhost:3000/api";

  console.log("Testing API endpoints...\n");

  try {
    // Test database status
    console.log("1. Testing database status...");
    const response = await fetch(`${baseUrl}/test-recommendations`);
    const data = await response.json();

    console.log("Database Status:", JSON.stringify(data.data, null, 2));

    // If we have breeding eligible gamefowls, test breeding recommendations
    if (
      data.data?.breedingEligible?.males > 0 &&
      data.data?.breedingEligible?.females > 0
    ) {
      console.log("\n2. Testing breeding recommendations...");
      const breedingResponse = await fetch(
        `${baseUrl}/recommendations/breeding`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const breedingData = await breedingResponse.json();
      console.log(
        "Breeding recommendations:",
        breedingData.success
          ? `Found ${breedingData.data.length} recommendations`
          : breedingData.error
      );
    } else {
      console.log("\n2. No breeding eligible gamefowls found!");
      console.log(
        "Need males with status IDLE or BREEDING:",
        data.data?.breedingEligible?.males || 0
      );
      console.log(
        "Need females with status IDLE or BREEDING:",
        data.data?.breedingEligible?.females || 0
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Run the test
testAPI();
