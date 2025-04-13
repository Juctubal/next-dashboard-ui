const Announcements = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-gray-200">
          Announcements
        </h1>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          View All
        </span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="bg-ggSkyLight dark:bg-blue-900/30 rounded-md p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium dark:text-gray-200">
              Lorem ipsum dolor sit.
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 rounded-md px-1 py-1">
              2025-01-01
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Voluptatum,
            expedita. Reru, quidem facilis?
          </p>
        </div>
        <div className="bg-ggPurpleLight dark:bg-purple-900/30 rounded-md p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium dark:text-gray-200">
              Lorem ipsum dolor sit.
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 rounded-md px-1 py-1">
              2025-01-01
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Voluptatum,
            expedita. Reru, quidem facilis?
          </p>
        </div>
        <div className="bg-ggYellowLight dark:bg-yellow-900/30 rounded-md p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium dark:text-gray-200">
              Lorem ipsum dolor sit.
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 rounded-md px-1 py-1">
              2025-01-01
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Voluptatum,
            expedita. Reru, quidem facilis?
          </p>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
