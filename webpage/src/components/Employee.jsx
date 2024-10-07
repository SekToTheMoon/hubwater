import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "./component/Table";
import SearchInput from "./component/SearchInput";
import MobileTable from "./component/MobileTable";

function Employee() {
  const axios = useAxiosPrivate();
  const [employees, setEmployees] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employeeForDel, setEmployeeForDel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  let messageSuccess = state && state.msg;
  const headers = ["รหัสพนักงาน", "ชื่อ-นามสกุล", "เบอร์โทร", "อีเมล"];

  const fetchEmployees = async () => {
    try {
      let url = `/employee?page=${currentPage}&per_page=${perPage}`;
      if (search !== "") {
        url += `&search=${search}`;
      }
      const response = await axios.get(url);
      setEmployees(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/employee/delete/" + id);
      setEmployeeForDel(null);
      fetchEmployees();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      // Handle network errors or other issues
      console.error("Error during registration:", error);
      toast.error("Error during registration", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    fetchEmployees();
  };

  useEffect(() => {
    fetchEmployees();
    if (messageSuccess) {
      toast.success(messageSuccess, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }, [currentPage, perPage]);

  const htmlTemplate = (rowData) => (
    <div className="w-full">
      <span className="text-secondary font-bold hover:underline">
        {rowData[0]}
      </span>

      <div className="text-sm mt-3 ">
        <div>ชื่อ : {rowData[1]}</div>

        <div className="flex flex-col">
          <div className="break-words">{rowData[2]}</div>
          <div className="break-words">{rowData[3]}</div>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">พนักงาน</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มพนักงาน
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          <Table headers={headers} data={employees} onDelete={handleDelete} />
          <MobileTable
            data={employees}
            onDelete={setEmployeeForDel}
            htmlTemplate={htmlTemplate}
          />
          <div className="flex justify-between mt-4">
            <select
              value={perPage}
              onChange={(e) => handlePerRowsChange(Number(e.target.value))}
              className="select select-primary"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              {/* Add more options if needed */}
            </select>
            {employees.length !== 0 ? (
              <div className="flex justify-between items-center">
                <span className="mr-5">
                  {`Showing ${(currentPage - 1) * perPage + 1}-${Math.min(
                    currentPage * perPage,
                    totalRows
                  )} of ${totalRows}`}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ArrowBigLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ArrowBigRight size={20} />
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        {employeeForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลพนักงาน</h3>
              <p className="py-4">
                ต้องการลบข้อมูลพนักงาน {employeeForDel} หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(employeeForDel);
                      setEmployeeForDel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setEmployeeForDel(null)}
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Employee;
