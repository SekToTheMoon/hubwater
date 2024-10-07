import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "./component/Table";
import MobileTable from "./component/MobileTable";
import SearchInput from "./component/SearchInput";

function Unit_m() {
  const axios = useAxiosPrivate();
  const [Unit_m, setUnit_m] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [unit_mForDel, setUnit_mForDel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const headers = ["รหัสหน่วยวัด", "ชื่อหน่วยวัด"];

  const fetchUnit_ms = async () => {
    let url = `/Unit_m?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setUnit_m(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Unit_ms:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/Unit_m/delete/" + id);
      setUnit_mForDel(null);
      fetchUnit_ms();
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

  const handleSearch = () => {
    fetchUnit_ms();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchUnit_ms();
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
      navigate("/Unit_m");
    }
  }, [currentPage, perPage]);

  const htmlTemplate = (rowData) => (
    <div>
      <span className="text-secondary font-bold hover:underline">
        {rowData[0]}
      </span>

      <div>หน่วยวัด : {rowData[1]}</div>
    </div>
  );

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">หน่วยวัด</h1>
          <div className="flex justify-between items-center mb-5 gap-4">
            <Link to="insert" className="btn btn-primary">
              เพิ่มหน่วยวัด
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>

          <Table headers={headers} data={Unit_m} onDelete={handleDelete} />
          <MobileTable
            data={Unit_m}
            onDelete={setUnit_mForDel}
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
            {Unit_m && Unit_m.length !== 0 ? (
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
        {unit_mForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลหน่วยวัด</h3>
              <p className="py-4">
                ต้องการลบข้อมูลหน่วนวัด {unit_mForDel} หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(unit_mForDel);
                      setUnit_mForDel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setUnit_mForDel(null)}
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

export default Unit_m;
