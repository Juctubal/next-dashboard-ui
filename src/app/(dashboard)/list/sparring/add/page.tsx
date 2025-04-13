import { prisma } from "@/lib/prisma";
import { Gamefowl } from "@prisma/client";
import { redirect } from "next/navigation";
import SparringForm from "./SparringForm";

const AddSparringPage = async () => {
  const gamefowls = await prisma.gamefowl.findMany({
    where: {
      isArchived: false,
      sex: "MALE",
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <h1 className="text-lg font-semibold mb-4">Add Sparring Record</h1>
      <SparringForm gamefowls={gamefowls} />
    </div>
  );
};

export default AddSparringPage;
