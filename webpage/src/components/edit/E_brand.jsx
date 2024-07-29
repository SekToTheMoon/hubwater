import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_brand() {
  const [values, setValues] = useState({ brand_name: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    brand_name: Yup.string().required("กรุณากรอกชื่อ ยี่ห้อ"),
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
        .put("/brand/edit/" + id, values)
        .then((res) =>
          navigate("/all/brand", { state: { msg: res.data.msg } })
        );
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hibrandrogressBar: false,
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
      .get("/getbrand/" + id)
      .then((res) => setValues({ brand_name: res.data[0].brand_name }))
      .catch((err) => console.log(err));
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">แก้ไขยี่ห้อ</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">ชื่อยี่ห้อ</label>
            <input
              type="text"
              placeholder="กรอกชื่อยี่ห้อ"
              value={values.brand_name}
              className="input input-bordered w-full mb-2"
              onChange={(e) => setValues({ brand_name: e.target.value })}
            />
            {errors.brand_name && (
              <span className="text-error">{errors.brand_name}</span>
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

export default E_brand;
