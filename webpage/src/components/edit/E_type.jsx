import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_type() {
  const [values, setValues] = useState({ type_name: "", type_category: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    type_name: Yup.string().required("กรุณากรอกชื่อ ประเภท"),
    type_category: Yup.string().required("กรุณากรอกชื่อ หมวดหมู่"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleEdit();
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });

      setErrors(newErrors);
    }
  };
  const handleEdit = async () => {
    try {
      await axios
        .put("http://localhost:3001/type/edit/" + id, values)
        .then((res) => navigate("/all/type", { state: { msg: res.data.msg } }));
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hityperogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3001/gettype/" + id)
      .then((res) =>
        setValues({
          type_name: res.data[0].type_name,
          type_category: res.data[0].type_category,
        })
      )
      .catch((err) => console.log(err));
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">แก้ไขประเภท</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">ชื่อประเภท</label>
            <input
              type="text"
              placeholder="กรอกชื่อประเภท"
              value={values.type_name}
              className="input input-bordered w-full mb-2"
              onChange={(e) =>
                setValues({ ...values, type_name: e.target.value })
              }
            />
            {errors.type_name && (
              <span className="text-error">{errors.type_name}</span>
            )}
            <label className="block mb-2  font-medium ">ชื่อหมวดหมู่</label>
            <input
              type="text"
              placeholder="กรอกชื่อหมวดหมู่"
              value={values.type_category}
              className="input input-bordered w-full mb-2"
              onChange={(e) =>
                setValues({ ...values, type_category: e.target.value })
              }
            />
            {errors.type_name && (
              <span className="text-error">{errors.type_category}</span>
            )}
            <button type="submit" className="btn btn-primary w-full">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default E_type;
