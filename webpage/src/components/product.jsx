import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchInput from "./component/SearchInput";

function product() {
  const axios = useAxiosPrivate();

  const [product, setproduct] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productForDel, setProductForDel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchproducts = async () => {
    let url = `/product?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setproduct(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/product/delete/" + id);
      setProductForDel(null);
      fetchproducts();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          product: "top-right",
          autoClose: 3000,
          hiproductrogressBar: false,
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
        product: "top-right",
        autoClose: 5000,
        hiproductrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchproducts();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchproducts();
    if (messageSuccess) {
      toast.success(messageSuccess, {
        product: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      navigate("/product");
    }
  }, [currentPage, perPage]);

  return (
    <>
      <div className="overflow-x-auto ">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">สินค้า</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              <i class="fa-solid fa-plus"></i>เพิ่มสินค้า
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          <table className="w-full table-auto hidden lg:inline-table">
            <thead className="bg-base-200 text-left">
              <tr className=" border-b">
                <th className="pl-4 py-3">รหัสสินค้า</th>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th className="text-center">คงเหลือ</th>
                <th className="text-center hidden lg:table-cell">
                  จุดสั่งซื้อ
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {product && product.length !== 0 ? (
                product.map((product) => (
                  <tr
                    className={
                      product.product_reorder >= product.product_amount
                        ? "text-error border-b"
                        : " border-b"
                    }
                    key={product.product_id}
                  >
                    <td className="pl-4 py-3 ">{product.product_id}</td>
                    <td className="align-middle">{product.product_name}</td>
                    <td className="align-middle">{product.product_price}</td>
                    <td className="text-center align-middle">
                      {product.product_amount}
                    </td>
                    <td className="text-center align-middle hidden lg:table-cell">
                      {product.product_reorder}
                    </td>

                    <td className="py-3 flex gap-2 items-center">
                      <Link
                        to={`stock/${product.product_id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        สต๊อก
                      </Link>
                      <Link
                        to={`edit/${product.product_id}`}
                        className="btn btn-primary btn-sm"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() => setProductForDel(product.product_id)}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {product.map((item, index) => (
              <div key={index} className="space-y-3 p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <div>
                    <span className="text-secondary font-bold hover:underline">
                      {item.product_id}
                    </span>

                    <div className="text-sm mt-3">
                      <div>สินค้า : {item.product_name}</div>
                      <div className="flex gap-x-3 flex-wrap">
                        <div>ราคา : {item.product_price}</div>
                        <div>คงเหลือ : {item.product_amount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="join join-vertical">
                    <Link
                      to={`stock/${item.product_id}`}
                      className="btn btn-secondary btn-sm join-item"
                    >
                      สต๊อก
                    </Link>
                    <Link
                      to={`edit/${item.product_id}`}
                      className="btn btn-warning text-warning-content btn-sm opacity-80 join-item"
                    >
                      แก้ไข
                    </Link>
                    <button
                      className="btn btn-error btn-sm text-error-content opacity-80 join-item"
                      onClick={() => setProductForDel(item.product_id)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            {product && product.length !== 0 ? (
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
        {productForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลสินค้า</h3>
              <p className="py-4">
                ต้องการลบข้อมูลสินค้า {productForDel} หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(productForDel);
                      setProductForDel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setProductForDel(null)}
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
      </div>
      <ToastContainer product="top-right" />
    </>
  );
}

export default product;
