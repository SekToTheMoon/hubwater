import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";

function E_out() {
  const { id } = useParams();
  const navigate = useNavigate();
  const employee_id = localStorage.getItem("employee_id");
  const employee_fullname =
    localStorage.getItem("employee_fname") +
    " " +
    localStorage.getItem("employee_lname");

  const [values, setValues] = useState({
    out_date: moment(new Date()).format("YYYY-MM-DD"),
    out_total: 0,
    out_detail: "",
    employee_id: employee_id,
    items: [],
    OldImage: null,
  });

  const [preValue, setPreValue] = useState({
    listo_name: "",
    listo_price: 0,
    listo_amount: 0,
    listo_total: 0,
    expensetype_id: "",
    expensetype_name: "",
  });

  const [errors, setErrors] = useState({});
  const [ExpenseType, setExpenseType] = useState([]);
  const [images, setImage] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const validationSchema = Yup.object({
    out_date: Yup.date().required("โปรดเลือกวันที่ของใบเอกสารค่าใช้จ่าย"),
    out_total: Yup.number().required("โปรดระบุรวมราคาใบเอกสารค่าใช้จ่าย"),
  });

  const fetchOut = async () => {
    let url = `/getout/${id}`;
    try {
      const response = await axios.get(url);
      const outData = response.data.outData;
      const outList = response.data.listData;
      const imgs = response.data.imagesData;
      setValues({
        out_date: moment(outData.out_date).format("YYYY-MM-DD"),
        out_total: outData.out_total,
        out_detail: outData.out_detail,
        employee_id: outData.employee_id,
        items: outList,
        OldImage: imgs,
      });
      let showImage = [];
      imgs.map((j) => {
        showImage.push(`http://localhost:3001/img/expense/${j.outimg}`);
      });
      setImageURL(showImage);
    } catch (error) {
      console.error("Error fetching expense types:", error);
    }
  };
  const fetchExpense = async () => {
    let url = `/getexpensetype/all`;
    try {
      const res = await axios.get(url);
      setExpenseType(res.data);
    } catch (error) {
      console.error("Error fetching expense types:", error);
    }
  };

  const handleAdd = () => {
    const newItem = {
      ...preValue,
      listo_total: preValue.listo_price * preValue.listo_amount,
    };

    if (editingIndex !== null) {
      const updatedItems = values.items.map((item, index) =>
        index === editingIndex ? newItem : item
      );
      setValues({
        ...values,
        items: updatedItems,
        out_total: updatedItems.reduce(
          (acc, item) => acc + item.listo_total,
          0
        ),
      });
      setEditingIndex(null); // Reset editing index
    } else {
      const updatedItems = [...values.items, newItem];
      setValues({
        ...values,
        items: updatedItems,
        out_total: updatedItems.reduce(
          (acc, item) => acc + item.listo_total,
          0
        ),
      });
    }

    setPreValue({
      listo_name: "",
      listo_price: 0,
      listo_amount: 0,
      listo_total: 0,
      expensetype_id: "",
      expensetype_name: "",
    });

    document.getElementById("my_modal_4").close();
  };

  const handleEdit = (index) => {
    const itemToEdit = values.items[index];
    setPreValue({
      listo_name: itemToEdit.listo_name,
      listo_price: itemToEdit.listo_price,
      listo_amount: itemToEdit.listo_amount,
      listo_total: itemToEdit.listo_total,
      expensetype_id: itemToEdit.expensetype_id,
      expensetype_name: itemToEdit.expensetype_name,
    });
    setEditingIndex(index);
    document.getElementById("my_modal_4").showModal();
  };
  const handleRemoveItem = (index) => {
    const updatedItems = values.items.filter((_, i) => i !== index);
    setValues({
      ...values,
      items: updatedItems,
      out_total: updatedItems.reduce((acc, item) => acc + item.listo_total, 0),
    });
  };

  //จัดการไฟล์รูปภาพ
  const handleFileChange = (e) => {
    console.log(e.target.files);
    const files = Array.from(e.target.files);
    setImage(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // await validationSchema.validate(values, { abortEarly: false });
      await handleUpdate(values);
      navigate("/all/out");
      setErrors({});
    } catch (error) {
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleUpdate = async (updatedValues) => {
    try {
      const formData = new FormData();

      // เพิ่มข้อมูลฟอร์มลงใน FormData
      formData.append("out_date", values.out_date);
      formData.append("out_total", values.out_total);
      formData.append("out_detail", values.out_detail);
      formData.append("employee_id", values.employee_id);

      formData.append("items", JSON.stringify(updatedValues.items));
      formData.append("oldImage", JSON.stringify(values.OldImage));

      // เพิ่มไฟล์รูปภาพลงใน FormData
      images.forEach((image) => {
        formData.append(`img`, image);
      });

      await axios.post(`/out/edit/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Updated successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      toast.error("Error during update", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  useEffect(() => {
    fetchExpense();
    fetchOut();
  }, []);
  useEffect(() => {
    console.log(values);
  }, [values]);

  useEffect(() => {
    if (images.length === 0) return;
    let showImages = [];
    images.map((img) => {
      showImages.push(URL.createObjectURL(img));
    });
    setImageURL(showImages);

    return () => {
      // Cleanup เมื่อ Component ถูก unmount
      showImages.map((img) => {
        URL.revokeObjectURL(img);
      });
    };
  }, [images]);

  return (
    <>
      <div className="rounded-box bg-base-100 p-5 min-h-full">
        <h1 className="ml-16 text-2xl">สร้างเอกสารค่าใช้จ่าย</h1>
        <hr className="my-4" />
        <form onSubmit={handleSubmit} className="mx-auto w-2/3 2xl:max-w-5xl">
          <div className="mt-5 mb-2 2xl:flex justify-between">
            <div className="form-control w-25">
              <label className="label">
                <span className="">พนักงาน</span>
              </label>
              <div className="input input-bordered flex items-center">
                {employee_fullname}
              </div>
              <label htmlFor="img" className=" mt-3   label  ">
                หลักฐานค่าใช้จ่าย
              </label>
              <input
                type="file"
                multiple
                name="img"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input file-input-bordered w-full"
              />
            </div>
            <div className="w-1/3">
              <div className="form-control ">
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                </label>
                <input
                  readOnly
                  type="text"
                  className="input text-3xl"
                  value={values.out_total}
                />
              </div>
              <div className="flex justify-between">
                <label className="label">
                  <span className="">วันที่:</span>
                </label>
                <input
                  type="date"
                  value={values.out_date}
                  onChange={(e) => {
                    setValues({
                      ...values,
                      out_date: e.target.value,
                    });
                  }}
                  className="input input-bordered w-1/2 "
                />
              </div>
            </div>
          </div>

          {imageURL && (
            <div className={`grid grid-cols-${imageURL.length}`}>
              {imageURL.map((url, index) => (
                <div
                  className="w-100 flex justify-center h-40 bg-base-200"
                  key={index}
                >
                  <img className="w-100" src={url} alt="uploaded" />
                </div>
              ))}
            </div>
          )}
          <hr />
          <div className="flex mt-2">
            <label className="label">
              <span className="">รายละเอียด:</span>
            </label>
            <input
              type="text"
              value={values.out_detail}
              className="input input-bordered flex-1"
              onChange={(e) => {
                setValues({ ...values, out_detail: e.target.value });
              }}
            />
          </div>
          {/* ตาราง */}
          <table className="w-full mt-2">
            <thead className="bg-base-200 text-left">
              <tr className="border-b text-center ">
                <th className="py-3">ลำดับ</th>
                <th>ชื่อสินค้า</th>
                <th>ราคาต่อหน่วย</th>
                <th>จำนวนสินค้า</th>
                <th>ราคารวม</th>
                <th>ประเภทค่าใช้จ่าย</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {values.items.map((item, index) => (
                <tr key={index} className="text-center">
                  <td>{index + 1}</td>
                  <td>{item.listo_name}</td>
                  <td>{item.listo_price}</td>
                  <td>{item.listo_amount}</td>
                  <td>{item.listo_total}</td>
                  <td>{item.expensetype_name}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleEdit(index)}
                      className="ml-2 px-2 py-1 bg-accent text-white rounded"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan="8" className="text-center ">
                  <div
                    className="btn mt-2"
                    onClick={() => {
                      document.getElementById("my_modal_4").showModal();
                    }}
                  >
                    เพิ่มรายการ
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <hr />
          <div className="ml-auto w-5/12">
            <div>
              <label className="label ">
                <span className="my-auto">รวมเป็นเงิน</span>
                <div className="w1/2">{values.out_total}</div>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mb-5">
            ตกลง
          </button>
        </form>
      </div>
      {/* model4 สินค้าทั้งหมด */}
      <dialog id="my_modal_4" className="modal">
        <div className="modal-box w-11/12 max-w-lg">
          <h3 className="font-bold text-lg">ข้อมูลรายการ</h3>
          <div className="grid grid-cols-3 gap-1 p-3">
            <label className="label">
              <span className="">ชื่อรายการ:</span>
            </label>
            <input
              type="text"
              value={preValue.listo_name}
              className="input input-bordered col-span-2"
              onChange={(e) => {
                setPreValue({ ...preValue, listo_name: e.target.value });
              }}
            />
            <label className="label">
              <span className="">ราคา:</span>
            </label>
            <input
              type="text"
              value={preValue.listo_price}
              className="input input-bordered col-span-2"
              onChange={(e) => {
                const newPrice = e.target.value;
                setPreValue({
                  ...preValue,
                  listo_price: newPrice,
                  listo_total: newPrice * preValue.listo_amount,
                });
              }}
            />
            <label className="label">
              <span className="">จำนวน:</span>
            </label>
            <input
              type="text"
              value={preValue.listo_amount}
              className="input input-bordered col-span-2"
              onChange={(e) => {
                const newAmount = e.target.value;
                setPreValue({
                  ...preValue,
                  listo_amount: newAmount,
                  listo_total: newAmount * preValue.listo_price,
                });
              }}
            />
            <label className="label">
              <span className="">ราคารวม:</span>
            </label>
            <input
              type="text"
              value={preValue.listo_total}
              className="input input-bordered col-span-2"
              readOnly
            />
            <label className="label">
              <span className="">ประเภทค่าใช้จ่าย</span>
            </label>
            <select
              className="select select-bordered col-span-2"
              value={preValue.expensetype_id}
              onChange={(e, index) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                setPreValue({
                  ...preValue,
                  expensetype_id: e.target.value,
                  expensetype_name: selectedOption.text,
                });
              }}
            >
              <option value="" disabled>
                เลือก
              </option>
              {ExpenseType.map((op) => (
                <option key={op.expensetype_name} value={op.expensetype_id}>
                  {op.expensetype_name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => {
                setPreValue({
                  listo_name: "",
                  listo_price: 0,
                  listo_amount: 0,
                  listo_total: 0,
                  expensetype_id: "",
                  expensetype_name: "",
                });
                setEditingIndex(null);
                document.getElementById("my_modal_4").close();
              }}
            >
              Close
            </button>
            <button onClick={handleAdd} className="btn btn-success">
              {editingIndex !== null ? "บันทึก" : "เพิ่มรายการ"}
            </button>
          </div>
        </div>
      </dialog>
      <ToastContainer position="top-right" />
    </>
  );
}

export default E_out;
