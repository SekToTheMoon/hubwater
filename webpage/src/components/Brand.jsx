import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "./component/Table";
import MobileTable from "./component/MobileTable";
import SearchInput from "./component/SearchInput";

function Brand() {
  const axios = useAxiosPrivate();
  const [Brand, setBrand] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brandForDel, setBrandForDel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;
  const headers = ["รหัสแบรนด์", "ชื่อแบรนด์"];

  const fetchBrands = async () => {
    let url = `/Brand?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setBrand(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Brands:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/Brand/delete/" + id);
      setBrandForDel(null);
      fetchBrands();
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
    fetchBrands();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchBrands();
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
      navigate("/Brand");
    }
  }, [currentPage, perPage]);

  const htmlTemplate = (rowData) => (
    <div>
      <span className="text-secondary font-bold hover:underline">
        {rowData[0]}
      </span>

      <div>แบรนด์ : {rowData[1]}</div>
    </div>
  );
  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">แบรนด์</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มแบรนด์
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>

          <Table headers={headers} data={Brand} onDelete={setBrandForDel} />
          <MobileTable
            data={Brand}
            onDelete={setBrandForDel}
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
            {Brand && Brand.length !== 0 ? (
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
        {brandForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลแบรนด์</h3>
              <p className="py-4">
                ต้องการลบข้อมูลชื่อแบรนด์ {brandForDel} หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(brandForDel);
                      setBrandForDel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setBrandForDel(null)}
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

export default Brand;
