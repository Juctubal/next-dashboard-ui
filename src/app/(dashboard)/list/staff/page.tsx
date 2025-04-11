import { fetchStaffData } from "./fetchStaffData";
import StaffListClient from "./StaffListClient";
import { currentUser } from "@clerk/nextjs/server";

const StaffListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const data = await fetchStaffData(searchParams);
  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;

  return (
    <StaffListClient
      data={data}
      searchParams={searchParams}
      userRole={userRole}
    />
  );
};

export default StaffListPage;
