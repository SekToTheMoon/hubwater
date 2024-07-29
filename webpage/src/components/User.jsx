import React, { useState, useEffect } from "react";
import axios from "../api/axios";

function User() {
  const columns = [
    {
      name: "First Name",
      selector: (row) => row.employee_id,
      sortable: true,
    },
    {
      name: "Last Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.employee_email,
      sortable: true,
    },
    // {
    //   name: "actions",
    //   options: {
    //     customBodyRender: (value, tableMeta) => {
    //       const userId = data[tableMeta.rowIndex].employee_id;
    //       return (
    //         <div className="flex">
    //           <button>
    //             <Link to={`/user&id=${userId}`}>
    //               <button>แก้ไข</button>
    //             </Link>
    //           </button>
    //           <button>
    //             <Link to={`/user&id=${userId}`}>
    //               <button>ลบ</button>
    //             </Link>
    //           </button>
    //         </div>
    //       );
    //     },
    //   },
    // },
  ];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const fetchUsers = async (page) => {
    setLoading(true);

    const response = await axios.get(`/user?page=${page}&per_page=${perPage}`);

    setData(response.data.data);
    setTotalRows(response.data.total);
    setLoading(false);
  };

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setLoading(true);

    const response = await axios.get(`/user?page=${page}&per_page=${perPage}`);

    setData(response.data.data);
    setPerPage(newPerPage);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [totalRows, perPage]);

  return (
    <>
      <h1 className="text-2xl mb-5">พนักงาน</h1>
      <div className="flex justify-between items-center mb-5">
        <button className="btn btn-accent">เพิ่มพนักงาน</button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        progressPending={loading}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        onChangeRowsPerPage={handlePerRowsChange}
        onChangePage={handlePageChange}
      />
    </>
  );
}

export default User;
