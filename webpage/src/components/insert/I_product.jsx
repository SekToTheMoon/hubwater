import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_product() {
  const axios = useAxiosPrivate();

  const [values, setValues] = useState({
    product_name: "",
    product_price: "",
    product_amount: "",
    product_reorder: "",
    product_detail: "",
    size: "",
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
  const [images, setImage] = useState([]);
  const [imageURL, setImageURL] = useState(null);

  const validationSchema = Yup.object({
    product_name: Yup.string()
      .max(45, "ความยาวไม่เกิน 45 ตัวอักษร")
      .required("กรุณากรอกชื่อ สินค้า"),
    product_price: Yup.string()
      .matches(/^\d+$/, "กรอกเป็นตัวเลขเท่านั้น")
      .required("กรุณากรอก"),
    product_reorder: Yup.string()
      .matches(/^\d+$/, "กรอกเป็นตัวเลขเท่านั้น")
      .required("กรุณากรอก"),
    size: Yup.string().required("กรุณากรอก"),
    unit_m_id: Yup.string().required("กรุณาเลือก"),
    unit_id: Yup.string().required("กรุณาเลือก"),
    type_id: Yup.string().required("กรุณาเลือก"),
  });

  const handleFileChange = (e) => {
    if (e.target.files.length === 1) {
      setImage([e.target.files[0]]);
    } else {
      console.log("เลือกรูปได้เพียง 1 รูป");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      await handleInsert();
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error?.inner?.forEach((err) => {
        console.log(err?.path);
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async () => {
    const formData = new FormData();
    formData.append("product_name", values.product_name);
    formData.append("product_price", values.product_price);
    formData.append("product_amount", values.product_amount);
    formData.append("product_reorder", values.product_reorder);
    formData.append("product_detail", values.product_detail);
    formData.append("size", values.size);
    formData.append("unit_m_id", values.unit_m_id);
    formData.append("unit_id", values.unit_id);
    formData.append("brand_id", values.brand_id);
    formData.append("type_id", values.type_id);
    formData.append("img", images[0]);
    try {
      const response = await axios.post("/product/insert", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
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
      console.log(error + " from error handleInsert");
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
      .get("/gettype/all")
      .then((res) => {
        setSelecttype(res.data);
        console.log(selectType);
      })
      .catch((err) => console.log(err));
  };
  const fetchUnit = async () => {
    await axios
      .get("/getunit/all")
      .then((res) => {
        setSelectunit(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchUnit_m = async () => {
    await axios
      .get("/getunit_m/all")
      .then((res) => {
        setSelectunit_m(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchBrand = async () => {
    await axios
      .get("/getbrand/all")
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

  useEffect(() => {
    if (images.length !== 1) return;

    const newImageURL = URL.createObjectURL(images[0]);
    setImageURL(newImageURL);
    console.log(images);

    return () => {
      // Cleanup เมื่อ Component ถูก unmount
      URL.revokeObjectURL(newImageURL);
    };
  }, [images]);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">เพิ่มสินค้า</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto lg:max-w-7xl"
          >
            <div className="flex-1 mb-5 ">
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
            <div className="mt-5 lg:flex gap-x-5">
              {" "}
              <div className="flex-1 mb-5 ">
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
                      {op.type_category}
                    </option>
                  ))}
                </select>
                {errors.type_id && (
                  <span className="text-error">{errors.type_id}</span>
                )}
              </div>
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">
                  หน่วยของสินค้า
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.unit_id}
                  onChange={(e) => {
                    setValues({ ...values, unit_id: e.target.value });
                  }}
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
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">แบรนด์</label>
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
            </div>
            <div className="mt-5 lg:flex gap-x-5">
              {" "}
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">ราคา</label>
                <input
                  type="text"
                  placeholder=""
                  name="product_price"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) => {
                    setValues({ ...values, product_price: e.target.value });
                  }}
                />
                {errors.product_price && (
                  <span className="text-error">{errors.product_price}</span>
                )}
              </div>
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">
                  จุดสั่งซื้อสินค้า
                </label>
                <input
                  type="text"
                  placeholder=""
                  name="product_reorder"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) => {
                    setValues({ ...values, product_reorder: e.target.value });
                  }}
                />
                {errors.product_reorder && (
                  <span className="text-error">{errors.product_reorder}</span>
                )}
              </div>
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">ขนาด</label>
                <input
                  type="text"
                  placeholder="20 X 10"
                  name="size"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) => {
                    setValues({ ...values, size: e.target.value });
                  }}
                />
                {errors.size && (
                  <span className="text-error">{errors.size}</span>
                )}
              </div>
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">หน่วยวัด</label>
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
            </div>
            <div className="mt-5 lg:flex gap-x-5">
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="img"
                  className="block mb-2 text-sm font-medium  "
                >
                  รูปสินค้า
                </label>
                <input
                  type="file"
                  name="img"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input file-input-bordered w-full"
                />
                {imageURL && (
                  <div className="w-100 flex justify-center h-40 bg-base-200">
                    <img className="w-100" src={imageURL} alt="uploaded" />
                  </div>
                )}
              </div>
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">รายละเอียด</label>
                <textarea
                  type="text"
                  placeholder=""
                  name="product_detail"
                  className="textarea textarea-bordered w-full mb-1 h-52"
                  onChange={(e) => {
                    setValues({ ...values, product_detail: e.target.value });
                  }}
                />
                {errors.product_detail && (
                  <span className="text-error">{errors.product_detail}</span>
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
