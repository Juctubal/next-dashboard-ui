const Table = ({
  columns,
  renderRow,
  data,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
}) => {
  return (
    <table className="w-full mt-4 border-collapse">
      <thead>
        <tr className="text-left text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
          {columns.map((col) => (
            <th
              key={col.accessor}
              className={`py-3 px-4 ${col.className || ""}`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item) => renderRow(item))
        ) : (
          <tr>
            <td
              colSpan={columns.length}
              className="py-8 text-center text-gray-500 dark:text-gray-400"
            >
              No information available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default Table;
