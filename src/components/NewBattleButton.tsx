"use client";

import { Gamefowl } from "@prisma/client";
import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const SparringForm = dynamic(() => import("./forms/SparringForm"), {
  loading: () => <h1>Loading...</h1>,
});

interface NewBattleButtonProps {
  gamefowls: Gamefowl[];
}

const NewBattleButton = ({ gamefowls }: NewBattleButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-ggYellow text-black dark:text-gray-800 px-3 py-1.5 rounded-md hover:bg-ggYellow/90 dark:hover:bg-ggYellow/80 mb-4 text-sm"
      >
        New Battle
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <SparringForm
              type="create"
              data={{ gamefowls }}
              gamefowls={gamefowls}
              onClose={handleClose}
            />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={handleClose}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewBattleButton;
