import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_product() {
  const [values, setValues] = useState({
    product_name: "",
    product_price: "",
    product_amount: "",
    product_reorder: "",
    product_detail: "",
    unit_m_id: "",
    unit_id: "",
    brand_id: "",
    type_id: "",
  });
  const [errors, setErrors] = useState({});
  const [selectUnit, setSelectunit] = useState([]);
  const [selectUnit_m, setSelectunit_m] = useState([]);
  const [selectBrand, setSelectbrand] = useState([]);
  const [selectType, setSelecttype] = useState([]);

  const validationSchema = Yup.object({
    product_name: Yup.string().required("กรุณากรอกชื่อ แผนก"),
    type_id: Yup.string().required("กรุณาเลือกแผนกด้วย"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleInsert();
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        console.log(err.path);
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/product/insert",
        values
      );
      toast.info(response.data.msg, {
        product: "top-right",
        autoClose: 3000,
        hityperogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.response.data.msg, {
        product: "top-right",
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
  //เอาแผนกท้ังหมด
  const fetchType = async () => {
    await axios
      .get("http://localhost:3001/gettype/all")
      .then((res) => {
        setSelecttype(res.data);
        console.log(selectType);
      })
      .catch((err) => console.log(err));
  };
  const fetchUnit = async () => {
    await axios
      .get("http://localhost:3001/getunit/all")
      .then((res) => {
        setSelectunit(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchUnit_m = async () => {
    await axios
      .get("http://localhost:3001/getunit_m/all")
      .then((res) => {
        setSelectunit_m(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchBrand = async () => {
    await axios
      .get("http://localhost:3001/getbrand/all")
      .then((res) => {
        setSelectbrand(res.data);
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => {
    fetchType();
    fetchBrand();
    fetchUnit();
    fetchUnit_m();
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">เพิ่มสินค้า</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              {" "}
              <div>
                <label className="block mb-2  font-medium ">ประเภทสินค้า</label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.type_id}
                  onChange={(e) =>
                    setValues({ ...values, type_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectType.map((op) => (
                    <option key={op.type_id} value={op.type_id}>
                      {op.type_name}
                    </option>
                  ))}
                </select>
                {errors.type_id && (
                  <span className="text-error">{errors.type_id}</span>
                )}
              </div>
              <div>
                <label className="block mb-2  font-medium ">ประเภทสินค้า</label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.unit_id}
                  onChange={(e) =>
                    setValues({ ...values, unit_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectUnit.map((op) => (
                    <option key={op.unit_id} value={op.unit_id}>
                      {op.unit_name}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <span className="text-error">{errors.unit_id}</span>
                )}
              </div>
              <div>
                <label className="block mb-2  font-medium ">ประเภทสินค้า</label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.unit_m_id}
                  onChange={(e) =>
                    setValues({ ...values, unit_m_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectUnit_m.map((op) => (
                    <option key={op.unit_m_id} value={op.unit_m_id}>
                      {op.unit_m_name}
                    </option>
                  ))}
                </select>
                {errors.unit_m_id && (
                  <span className="text-error">{errors.unit_m_id}</span>
                )}
              </div>
              <div>
                <label className="block mb-2  font-medium ">ประเภทสินค้า</label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.brand_id}
                  onChange={(e) =>
                    setValues({ ...values, brand_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectBrand.map((op) => (
                    <option key={op.brand_id} value={op.brand_id}>
                      {op.brand_name}
                    </option>
                  ))}
                </select>
                {errors.brand_id && (
                  <span className="text-error">{errors.brand_id}</span>
                )}
              </div>
              <div>
                <label className="block mb-2  font-medium ">ชื่อสินค้า</label>
                <input
                  type="text"
                  placeholder=""
                  name="product_name"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) => {
                    setValues({ ...values, product_name: e.target.value });
                  }}
                />
                {errors.product_name && (
                  <span className="text-error">{errors.product_name}</span>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer product="top-right" />
    </>
  );
}

export default I_product;
