const Pagination = () => {
  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <div className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
        Prev
      </div>
      <div className="">
        <button className="px-2 rounded-sm bg-ggSky">1</button>
        <button className="px-2 rounded-sm">2</button>
        <button className="px-2 rounded-sm">3</button>
        ...
        <button className="px-2 rounded-sm">10</button>
      </div>

      <div className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
        Next
      </div>
    </div>
  );
};

export default Pagination;
