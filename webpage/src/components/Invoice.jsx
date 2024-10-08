import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import statusOptions from "../constants/statusOptions";
import io from "socket.io-client";
import { handleChangeStatus } from "../utils/changeStatus";
import DocumentLink from "./component/DocumentLink";
import useAuth from "../hooks/useAuth";
import SearchInput from "./component/SearchInput";
import MobileDocTable from "./component/MobileDocTable";

function Invoice() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll
  const roll = auth.posit_name === "หัวหน้า" ? "หัวหน้า" : "ลูกน้อง";

  const [Invoice, setInvoice] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [invoiceForDel, setInvoicefordel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusInvoice = statusOptions[2];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchInvoices = async () => {
    let url = `/Invoice?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setInvoice(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Invoices:", error);
    }
  };

  const handleSelectChange = async (event, invoice) => {
    const selectedValue = event.target.value;
    if (selectedValue === "สร้างใบเสร็จรับเงิน") {
      navigate(`/receipt/insert?invoice=${invoice.iv_id}`);
      // } else if (selectedValue === "ยกเลิก") {
      //   // await handleRetureStock(invoice.iv_id);
      //   handleChangeStatus(selectedValue, invoice.iv_id);
      // } else if (selectedValue === "อนุมัติ") {
      //   // await handleStockCut(invoice.iv_id);
      //   handleChangeStatus(selectedValue, invoice.iv_id);
    } else {
      handleChangeStatus(selectedValue, invoice.iv_id);
    }
  };

  // const handleRetureStock = async (iv_id) => {
  //   try {
  //     const response = await axios.put(`/returestock`, {
  //       id: iv_id,
  //     });
  //   } catch (error) {
  //     toast.success("เกิดข้อผิดพลาดในการคืนสต๊อกสินค้า", {
  //       position: "top-right",
  //       autoClose: 3000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //       progress: undefined,
  //       theme: "dark",
  //     });
  //     return;
  //   }
  // };

  // const handleStockCut = async (iv_id) => {
  //   try {
  //     axios.put(`/stockcut`, { id: iv_id });
  //   } catch (err) {
  //     console.error("ตัดสต๊อกสินค้าไม่สำเร็จ:", err);
  //     toast.error("ตัดสต๊อกสินค้าไม่สำเร็จ", {
  //       position: "top-right",
  //       autoClose: 5000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //       progress: undefined,
  //       theme: "dark",
  //     });
  //     throw new Error("No items found for the given invoice ID");
  //   }
  // };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/invoice/delete/" + id);
      setInvoicefordel(null);
      fetchInvoices();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hiInvoicerogressBar: false,
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
        autoClose: 5000,
        hiInvoicerogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchInvoices();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchInvoices();
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
      navigate("/Invoice");
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("IV")) {
        setInvoice((oldInvoice) => {
          let newInvoice = [...oldInvoice];
          const index = newInvoice.findIndex((q) => q.iv_id === id);
          if (index !== -1) {
            newInvoice[index].iv_status = status;
          }
          return newInvoice;
        });
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบแจ้งหนี้</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              <i class="fa-solid fa-plus"></i>เพิ่มเอกสาร
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          {invoiceForDel && (
            <dialog open className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">ลบข้อมูลใบแจ้งหนี้</h3>
                <p className="py-4">
                  ต้องการลบข้อมูลใบแจ้งหนี้ {invoiceForDel} หรือไม่
                </p>
                <div className="modal-action">
                  <form method="dialog">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleDelete(invoiceForDel);
                        setInvoicefordel(null);
                      }}
                    >
                      ยืนยัน
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => setInvoicefordel(null)}
                    >
                      ยกเลิก
                    </button>
                  </form>
                </div>
              </div>
            </dialog>
          )}

          <table className="w-full text-center table-auto hidden lg:inline-table">
            <thead className="bg-base-200">
              <tr className=" border-b">
                <th className="pl-4 py-3">วันที่</th>
                <th>เลขเอกสาร</th>
                <th>ลูกค้า</th>
                <th className="text-center">ยอดรวมสุทธิ</th>
                <th>พนักงาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Invoice && Invoice.length !== 0 ? (
                Invoice.map((invoice, index) => (
                  <tr className="border-b" key={invoice.iv_id}>
                    <td className="pl-4 py-3">
                      {invoice.iv_date.substring(0, 10)}
                    </td>
                    <td className="group relative ">
                      <span
                        className="cursor-pointer hover:underline "
                        onClick={() => navigate(`view/${invoice.iv_id}`)}
                      >
                        {invoice.iv_id}
                      </span>
                      {(invoice.quotation_id ||
                        invoice.bn_id ||
                        invoice.rc_id) && (
                        <div className="absolute bg-white  border py-2 px-3 rounded-md inline-block whitespace-nowrap top-0 left-full text-sm  z-10 invisible font-sm group-hover:visible ">
                          <p className="font-bold mb-2">เอกสารที่เกี่ยวข้อง</p>
                          <div className="flex flex-col space-y-2">
                            <DocumentLink
                              to={`/quotation/view/${invoice.quotation_id}`}
                              id={invoice.quotation_id}
                            />
                            <DocumentLink
                              to={`/invoice/view/${invoice.bn_id}`}
                              id={invoice.bn_id}
                            />
                            <DocumentLink
                              to={`/receipt/view?receipt=${invoice.rc_id}`}
                              id={invoice.rc_id}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{invoice.customer_fname}</td>
                    <td className="text-right pr-2">
                      {invoice.iv_vat
                        ? Intl.NumberFormat().format(
                            (invoice.iv_total * 1.07).toFixed(2)
                          )
                        : Intl.NumberFormat().format(invoice.iv_total)}
                    </td>
                    <td>{invoice.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={invoice.iv_status}
                        className="select select-bordered w-36 max-w-36"
                        onChange={(e) => handleSelectChange(e, invoice)}
                      >
                        {statusInvoice[invoice.iv_status][roll].map(
                          (element, idx) => (
                            <option key={idx} value={element}>
                              {element}
                            </option>
                          )
                        )}
                      </select>
                      <div className="dropdown dropdown-hover ">
                        <div tabIndex={0} role="button" className="p-2">
                          ...
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box"
                        >
                          <li
                            className={
                              invoice.iv_status === "ดำเนินการแล้ว"
                                ? "disabled"
                                : ""
                            }
                          >
                            <Link
                              onClick={(e) =>
                                invoice.iv_status === "ดำเนินการแล้ว" &&
                                e.preventDefault()
                              }
                              to={`edit/${invoice.iv_id}`}
                            >
                              แก้ไข
                            </Link>
                          </li>
                          <li>
                            <button onClick={() => setInvoicefordel(invoice)}>
                              ลบ
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="pt-5 text-center">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <MobileDocTable
            data={Invoice}
            onDelete={setInvoicefordel}
            statusList={statusInvoice}
            handleSelectChange={handleSelectChange}
            roll={roll}
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
            {Invoice && Invoice.length !== 0 ? (
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
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Invoice;
