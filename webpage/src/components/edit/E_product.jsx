import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_product() {
  const axios = useAxiosPrivate();

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
  const [images, setImage] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    product_name: Yup.string().required("กรุณากรอกชื่อ แผนก"),
    type_id: Yup.string().required("กรุณาเลือกแผนกด้วย"),
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
      handleUpdate();
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

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("product_name", values.product_name);
    formData.append("product_price", values.product_price);
    formData.append("product_amount", values.product_amount);
    formData.append("product_reorder", values.product_reorder);
    formData.append("product_detail", values.product_detail);
    formData.append("unit_m_id", values.unit_m_id);
    formData.append("unit_id", values.unit_id);
    formData.append("brand_id", values.brand_id);
    formData.append("type_id", values.type_id);
    formData.append("img", images[0]);

    try {
      await axios
        .put(`/product/edit/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => navigate("/product", { state: { msg: res.data.msg } }));
    } catch (error) {
      toast.error(error.response.data.msg, {
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
  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/getproduct/${id}`);
      const productData = response.data[0];
      setValues({
        product_name: productData.product_name,
        product_price: productData.product_price,
        product_amount: productData.product_amount,
        product_reorder: productData.product_reorder,
        product_detail: productData.product_detail,
        unit_m_id: productData.unit_m_id,
        unit_id: productData.unit_id,
        brand_id: productData.brand_id,
        type_id: productData.type_id,
      });
      // ดึง URL รูปภาพ
      setImageURL(
        `http://localhost:3001/img/product/${productData.product_img}`
      );
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };
  useEffect(() => {
    fetchProduct();
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
        <h1 className="text-2xl ">แก้ไขสินค้า</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto 2xl:max-w-7xl"
          >
            <div className="flex-1 mb-5 ">
              <label className="block mb-2  font-medium ">ชื่อสินค้า</label>
              <input
                type="text"
                placeholder=""
                name="product_name"
                value={values.product_name}
                className="input input-bordered w-full mb-1"
                onChange={(e) => {
                  setValues({ ...values, product_name: e.target.value });
                }}
              />
              {errors.product_name && (
                <span className="text-error">{errors.product_name}</span>
              )}
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
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
            <div className="mt-5 2xl:flex gap-x-5">
              {" "}
              <div className="flex-1 mb-5 ">
                <label className="block mb-2  font-medium ">ราคา</label>
                <input
                  type="text"
                  placeholder=""
                  name="product_price"
                  value={values.product_price}
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
                  value={values.product_reorder}
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
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
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
                  value={values.product_detail}
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

export default E_product;
