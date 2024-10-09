import { useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import SearchInput from "./SearchInput";
function ProductModel({ setValues, list }) {
  const axios = useAxiosPrivate();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [lotNumbers, setLotNumbers] = useState([]);
  const [productDetail, setProductdetail] = useState(null);
  /// fetch product ตอนเปิดหน้าเว็บ
  const fetchProduct = async () => {
    let url = `/getproduct/all`;
    if (search !== "") {
      url += `?search=${search}`;
    }
    try {
      const res = await axios.get(url);
      setSelectedProduct(res.data);
    } catch (error) {
      console.log(err);
    }
  };
  // fetch lot ของสินค้า
  const fetchLotNumbers = async (productID) => {
    try {
      const response = await axios.get(`/selectstock/${productID}`);
      setLotNumbers(response.data);
    } catch (error) {
      console.error("Error fetching lot numbers:", error);
    }
  };

  const handleSelectProduct = async (product, list) => {
    try {
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_img: product.product_img,
        unit_name: product.unit_name,
        [list[0]]: product.product_price,
        [list[1]]: 1,
        lot_number: "", // ค่า lot_number ยังไม่ได้กำหนด
      };
      setProductdetail(newItem);
      fetchLotNumbers(product.product_id);
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  //เมื่อกดเลือก lot สินค้า
  const handleSelectLotProduct = async (Productlot) => {
    try {
      const updatedProductDetail = { ...productDetail, lot_number: Productlot };
      setValues((prevValues) => ({
        ...prevValues,
        items: [...prevValues.items, updatedProductDetail],
      }));
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  return (
    <>
      {/* model4 สินค้าทั้งหมด */}
      <dialog id="my_modal_4" className="modal">
        <div className="modal-box w-11/12 max-w-5xl  flex flex-col">
          <div className="flex flex-col md:justify-between md:flex-row">
            <h3 className="font-bold text-lg">รายชื่อสินค้า</h3>
            <SearchInput
              setSearch={setSearch}
              handleSearch={fetchProduct}
              search={search}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>รูปสินค้า</th>
                  <th>ชื่อสินค้า</th>
                  <th>ราคาขาย</th>
                  <th>คงเหลือ</th>
                  <th>หน่วยสินค้า</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {selectedProduct.map((product) => (
                  <tr key={product.product_id}>
                    <td>
                      <div className="w-10 md:w-20">
                        <img
                          src={`http://hubwater-production-7ee5.up.railway.app/img/product/${product.product_img}`}
                          alt={product.product_name}
                          className="w-full"
                        />
                      </div>
                    </td>
                    <td>{product.product_name}</td>
                    <td>{product.product_price}</td>
                    <td>{product.product_amount}</td>
                    <td>{product.unit_name}</td>
                    <td>
                      {/* <button onClick={() => handleSelectProduct(product)}>
                      เลือก
                    </button> */}
                      <button
                        className="btn"
                        onClick={() => {
                          document.getElementById("my_modal_3").showModal();
                          handleSelectProduct(product, list);
                        }}
                      >
                        เลือก
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button, it will close the modal */}
              <button
                className="btn btn-error text-error-content"
                onClick={() => {
                  setSelectedProduct([]);
                  setSearch("");
                }}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* model3 ล็อตสินค้า */}
      <dialog id="my_modal_3" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="font-bold text-lg">ล๊อตสินค้า</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>เลขล็อตสินค้า</th>
                  <th>วันที่นำเข้า</th>
                  <th>วันหมดอายุ</th>
                  <th>ราคาทุน</th>
                  <th>จำนวนคงเหลือ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lotNumbers.map((lot_product) => (
                  <tr key={lot_product.lot_number}>
                    <td>{lot_product.lot_number}</td>
                    <td>{lot_product.lot_date}</td>
                    <td>{lot_product.lot_lot_has_exp}</td>
                    <td>{lot_product.lot_price}</td>
                    <td>{lot_product.lot_amount}</td>
                    <td>
                      <button
                        className="btn"
                        onClick={() =>
                          handleSelectLotProduct(lot_product.lot_number)
                        }
                      >
                        เลือก
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button, it will close the modal */}
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default ProductModel;
