import React, { useState, useEffect } from "react";

import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Chart as ChartJS, plugins } from "chart.js/auto";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import moment from "moment";
function selectTimeline(onChangeFunc) {
  return (
    <select
      className="select join-item select-bordered w-full max-w-xl min-h-1 h-9"
      onChange={(e) => onChangeFunc(e.target.value)}
      defaultValue="year"
    >
      <option value="year">1 ปี</option>
      <option value="6month">6 เดือน</option>
      <option value="3month">3 เดือน</option>
      <option value="1month">1 เดือน</option>
    </select>
  );
}
function StackedBarChart(data) {
  const options = {
    scales: {
      x: { stacked: true },
      y: { stacked: false, beginAtZero: true },
    },
  };
  return <Bar data={data} options={options}></Bar>;
}

function Dashboard() {
  const axiosPrivate = useAxiosPrivate();

  const [incomeData, setIncomeData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [incomeAndExpense, setIncomeAndExpense] = useState(null);
  const [CrossTab, setCrossTab] = useState();
  const [expenseTypeData, setExpenseTypeData] = useState(null);
  const [buyProductData, setBuyProductData] = useState(null);
  const [Commition, setCommition] = useState([]);
  const [waitToPay, setWaitToPay] = useState();
  const [TopSale, setTopSale] = useState();
  const [TotalIncomeAndExpense, setTotalIncomeAndExpense] = useState(null);

  const [categoryProduct, setCategoryProduct] = useState(null);

  //รายงานสินค้าขายดี
  const [DateRanges, setDateRanges] = useState({
    startDate: moment().subtract(1, "years").format("YYYY-MM-DD"),
    endDate: moment(new Date()).format("YYYY-MM-DD"),
    selectCategory: "ทั้งหมด",
  });

  const [saleProductDateRanges, setSaleProductDateRanges] = useState({
    startDate: moment().subtract(1, "years").format("YYYY-MM-DD"),
    endDate: moment(new Date()).format("YYYY-MM-DD"),
    selectCategory: "ทั้งหมด",
  });

  const [buyProductDateRanges, setBuyProductDataDateRanges] = useState({
    startDate: moment().subtract(1, "years").format("YYYY-MM-DD"),
    endDate: moment(new Date()).format("YYYY-MM-DD"),
  });
  const [commitionDateRanges, setCommitionDateRanges] = useState({
    startDate: moment().subtract(1, "years").format("YYYY-MM-DD"),
    endDate: moment(new Date()).format("YYYY-MM-DD"),
  });

  const handleSubmitTopSale = (e) => {
    e.preventDefault();

    if (DateRanges.endDate > DateRanges.startDate) {
      fetchTopSale(
        DateRanges.startDate,
        DateRanges.endDate,
        DateRanges.selectCategory
      );
    } else {
      alert("Please select a valid date range");
    }
  };
  const handleSubmitSaleProduct = (e) => {
    e.preventDefault();

    if (saleProductDateRanges.endDate > saleProductDateRanges.startDate) {
      fetchSaleProduct(
        saleProductDateRanges.startDate,
        saleProductDateRanges.endDate,
        saleProductDateRanges.selectCategory
      );
    } else {
      alert("Please select a valid date range");
    }
  };
  const handleSubmitCommition = (e) => {
    e.preventDefault();
    if (commitionDateRanges.endDate > commitionDateRanges.startDate) {
      fetchCommition(
        commitionDateRanges.startDate,
        commitionDateRanges.endDate
      );
    } else {
      alert("Please select a valid date range");
    }
  };

  const handleSubmitBuyProduct = (e) => {
    e.preventDefault();
    if (buyProductDateRanges.endDate > buyProductDateRanges.startDate) {
      fetchBuyProduct(
        buyProductDateRanges.startDate,
        buyProductDateRanges.endDate
      );
    } else {
      alert("Please select a valid date range");
    }
  };

  const fetchCategoryProduct = async () => {
    try {
      const response = await axiosPrivate.get(`/getCategoryProduct`);
      setCategoryProduct(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchIncome = async (timeline) => {
    try {
      const response = await axiosPrivate.get(
        `/getIncome?timeline=${timeline}`
      );
      const data = response.data;
      setIncomeData({
        labels: data.labels,
        datasets: [
          {
            label: "รายได้รวม",
            data: data.totalIncomeData,
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: "เก็บเงินแล้ว",
            data: data.incomeData,
            backgroundColor: "rgba(54, 162, 235, 1)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      });
      // setTotalIncome(data.totalIncomeSum);
      // setTotalReceived(data.totalReceivedSum);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchExpense = async (timeline) => {
    try {
      const response = await axiosPrivate.get(
        `/getExpense?timeline=${timeline}`
      );
      const data = response.data;
      setExpenseData({
        labels: data.labels,
        datasets: [
          {
            label: "ค่าใช้จ่ายรวม",
            data: data.totalExpenseData,
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
          {
            label: "ชำระเงินแล้ว",
            data: data.expenseData,
            backgroundColor: "rgba(255, 99, 132, 1)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      });
      // setTotalIncome(data.totalIncomeSum);
      // setTotalReceived(data.totalReceivedSum);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchIncomeAndExpense = async (timeline) => {
    try {
      const responseIncome = await axiosPrivate.get(
        `/getIncome?timeline=${timeline}`
      );
      const responseExpense = await axiosPrivate.get(
        `/getExpense?timeline=${timeline}`
      );
      const dataIncome = responseIncome.data;
      const dataExpense = responseExpense.data;

      const sumIncome = dataIncome.totalIncomeData.reduce(
        (sum, row) => sum + parseFloat(row),
        0
      );
      const sumExpense = dataExpense.totalExpenseData.reduce(
        (sum, row) => sum + parseFloat(row),
        0
      );

      setTotalIncomeAndExpense({
        sumIncome: sumIncome,
        sumExpense: sumExpense,
      });
      setIncomeAndExpense({
        labels: dataIncome.labels,
        datasets: [
          {
            label: "รายได้รวม",
            data: dataIncome.totalIncomeData,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
          {
            label: "ค่าใช้จ่ายรวม",
            data: dataExpense.totalExpenseData,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchSaleProduct = async (startDate, endDate, category) => {
    let url = `/getSaleProduct?startDate=${startDate}&&endDate=${endDate}&&category=${category}`;
    try {
      const response = await axiosPrivate.get(url);
      // const labels = response.data.map((item) => item.product_name);
      const data = response.data;
      setCrossTab(data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchExpenseByCategory = async (timeline) => {
    let url = `/getExpenseByCategory?timeline=${timeline}`;
    try {
      const response = await axiosPrivate.get(url);
      const labels = response.data.map((item) => item.expensetype_name);
      const data = response.data.map((item) =>
        parseInt(item.total_expense_amount)
      );
      setExpenseTypeData({
        labels: labels,
        datasets: [
          {
            label: "ยอดชำระ",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 159, 64, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchCommition = async (startDate, endDate) => {
    try {
      const response = await axiosPrivate.get(
        `/getCommition?startDate=${startDate}&&endDate=${endDate}`
      );
      setCommition(response.data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchBuyProduct = async (startDate, endDate) => {
    try {
      const response = await axiosPrivate.get(
        `/getBuyProduct?startDate=${startDate}&&endDate=${endDate}`
      );
      setBuyProductData(response.data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchWaitToPlay = async (timeline) => {
    try {
      const response = await axiosPrivate.get(
        `/getWaitToPlay?timeline=${timeline}`
      );
      setWaitToPay(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchTopSale = async (startDate, endDate, category) => {
    try {
      const response = await axiosPrivate.get(
        `/getTopSale?startDate=${startDate}&&endDate=${endDate}&&category=${category}`
      );
      const data = response.data;
      setTopSale(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchIncome("year");
    fetchExpense("year");
    fetchSaleProduct(
      saleProductDateRanges.startDate,
      saleProductDateRanges.endDate,
      saleProductDateRanges.selectCategory
    );
    fetchIncomeAndExpense("year");
    fetchExpenseByCategory("year");
    fetchWaitToPlay("year");
    fetchCommition(commitionDateRanges.startDate, commitionDateRanges.endDate);
    fetchBuyProduct(
      buyProductDateRanges.startDate,
      buyProductDateRanges.endDate
    );
    fetchTopSale(
      DateRanges.startDate,
      DateRanges.endDate,
      DateRanges.selectCategory
    );
    fetchCategoryProduct();
  }, []);

  // useEffect(() => {
  //   let isMounted = true;
  //   const controller = new AbortController();

  //   const fetchCategoryProduct1 = async () => {
  //     try {
  //       const response = await axiosPrivate.get(`/getCategoryProduct`, {
  //         signal: controller.signal,
  //       });
  //       setCategoryProduct(response.data);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   const fetchIncome1 = async (timeline) => {
  //     try {
  //       const response = await axiosPrivate.get(
  //         `/getIncome?timeline=${timeline}`,
  //         {
  //           signal: controller.signal,
  //         }
  //       );
  //       const data = response.data;
  //       setIncomeData({
  //         labels: data.labels,
  //         datasets: [
  //           {
  //             label: "รายได้รวม",
  //             data: data.totalIncomeData,
  //             backgroundColor: "rgba(75, 192, 192, 0.5)",
  //             borderColor: "rgba(75, 192, 192, 1)",
  //             borderWidth: 1,
  //           },
  //           {
  //             label: "เก็บเงินแล้ว",
  //             data: data.incomeData,
  //             backgroundColor: "rgba(54, 162, 235, 1)",
  //             borderColor: "rgba(54, 162, 235, 1)",
  //             borderWidth: 1,
  //           },
  //         ],
  //       });
  //       setTotalIncome(data.totalIncomeSum);
  //       setTotalReceived(data.totalReceivedSum);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   const fetchExpense1 = async (timeline) => {
  //     try {
  //       const response = await axiosPrivate.get(
  //         `/getExpense?timeline=${timeline}`,
  //         {
  //           signal: controller.signal,
  //         }
  //       );
  //       const data = response.data;
  //       setExpenseData({
  //         labels: data.labels,
  //         datasets: [
  //           {
  //             label: "ค่าใช้จ่ายรวม",
  //             data: data.totalExpenseData,
  //             backgroundColor: "rgba(255, 99, 132, 0.5)",
  //             borderColor: "rgba(255, 99, 132, 1)",
  //             borderWidth: 1,
  //           },
  //           {
  //             label: "ชำระเงินแล้ว",
  //             data: data.expenseData,
  //             backgroundColor: "rgba(255, 99, 132, 1)",
  //             borderColor: "rgba(255, 99, 132, 1)",
  //             borderWidth: 1,
  //           },
  //         ],
  //       });
  //       // setTotalIncome(data.totalIncomeSum);
  //       // setTotalReceived(data.totalReceivedSum);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   const fetchIncomeAndExpense1 = async (timeline) => {
  //     try {
  //       const responseIncome = await axiosPrivate.get(
  //         `/getIncome?timeline=${timeline}`,
  //         {
  //           signal: controller.signal,
  //         }
  //       );
  //       const responseExpense = await axiosPrivate.get(
  //         `/getExpense?timeline=${timeline}`,
  //         {
  //           signal: controller.signal,
  //         }
  //       );
  //       const dataIncome = responseIncome.data;
  //       const dataExpense = responseExpense.data;

  //       setIncomeAndExpense({
  //         labels: dataIncome.labels,
  //         datasets: [
  //           {
  //             label: "รายได้รวม",
  //             data: dataIncome.totalIncomeData,
  //             backgroundColor: "rgba(54, 162, 235, 0.2)",
  //             borderColor: "rgba(54, 162, 235, 1)",
  //             borderWidth: 1,
  //           },
  //           {
  //             label: "ค่าใช้จ่ายรวม",
  //             data: dataExpense.totalExpenseData,
  //             backgroundColor: "rgba(255, 99, 132, 0.2)",
  //             borderColor: "rgba(255, 99, 132, 1)",

  //             borderWidth: 1,
  //           },
  //         ],
  //       });
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   const fetchSaleProduct1 = async (startDate, endDate) => {
  //     let url = `/getSaleProduct?startDate=${startDate}&&endDate=${endDate}`;
  //     try {
  //       const response = await axiosPrivate.get(url, {
  //         signal: controller.signal,
  //       });
  //       // const labels = response.data.map((item) => item.product_name);
  //       const data = response.data;
  //       setCrossTab(data);
  //     } catch (error) {
  //       console.error("Error fetching sales data:", error);
  //     }
  //   };
  //   const fetchExpenseByCategory1 = async (timeline) => {
  //     let url = `/getExpenseByCategory?timeline=${timeline}`;
  //     try {
  //       const response = await axiosPrivate.get(url, {
  //         signal: controller.signal,
  //       });
  //       const labels = response.data.map((item) => item.expensetype_name);
  //       const data = response.data.map((item) =>
  //         parseInt(item.total_expense_amount)
  //       );
  //       setExpenseTypeData({
  //         labels: labels,
  //         datasets: [
  //           {
  //             label: "ยอดชำระ",
  //             data: data,
  //             backgroundColor: [
  //               "rgba(255, 99, 132, 0.8)",
  //               "rgba(54, 162, 235, 0.8)",
  //               "rgba(255, 206, 86, 0.8)",
  //               "rgba(75, 192, 192, 0.8)",
  //               "rgba(153, 102, 255, 0.8)",
  //               "rgba(255, 159, 64, 0.8)",
  //             ],
  //             borderColor: [
  //               "rgba(255, 99, 132, 1)",
  //               "rgba(54, 162, 235, 1)",
  //               "rgba(255, 206, 86, 1)",
  //               "rgba(75, 192, 192, 1)",
  //               "rgba(153, 102, 255, 1)",
  //               "rgba(255, 159, 64, 1)",
  //             ],
  //             borderWidth: 1,
  //           },
  //         ],
  //       });
  //     } catch (error) {
  //       console.error("Error fetching sales data:", error);
  //     }
  //   };
  //   const fetchCommition1 = async (timeline) => {
  //     let url = `/getCommition?timeline=${timeline}`;
  //     try {
  //       const response = await axiosPrivate.get(url, {
  //         signal: controller.signal,
  //       });

  //       setCommition(response.data);
  //     } catch (error) {
  //       console.error("Error fetching sales data:", error);
  //     }
  //   };
  //   const fetchTopSale1 = async (startDate, endDate, category) => {
  //     try {
  //       const response = await axiosPrivate.get(
  //         `/getTopSale?startDate=${startDate}&&endDate=${endDate}&&category=${category}`,
  //         {
  //           signal: controller.signal,
  //         }
  //       );
  //       const data = response.data;
  //       setTopSale(data);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   fetchIncome1("year");
  //   fetchExpense1("year");
  //   fetchSaleProduct1(
  //     saleProductDateRanges.startDate,
  //     saleProductDateRanges.endDate
  //   );
  //   fetchIncomeAndExpense1("year");
  //   fetchExpenseByCategory1("year");
  //   fetchCommition1("year");
  //   fetchTopSale1(DateRanges.startDate, DateRanges.endDate, selectCategory);
  //   fetchCategoryProduct1();

  //   return () => {
  //     isMounted = false;
  //     controller.abort();
  //   };
  // }, []);

  return (
    <>
      <h1 className="text-3xl mb-5 text-neutral-content">ภาพรวมบริษัท</h1>
      <main className="grid grid-cols-8  gap-4">
        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg xl:col-span-8">
          <h2 className="card-title my-2">รายได้และค่าใช้จ่ายตามเอกสาร</h2>
          {selectTimeline(fetchIncomeAndExpense)}
          <figure className="flex flex-col mt-3 max-h-[30rem] 2xl:flex-row-reverse ">
            {incomeAndExpense && (
              <>
                <div className="flex gap-5 w-full 2xl:flex-col 2xl:pt-7">
                  <p>
                    <span className="text-blue-500">รายได้รวม : </span>
                    {`${new Intl.NumberFormat().format(
                      TotalIncomeAndExpense?.sumIncome
                    )}`}
                  </p>
                  <p>
                    <span className="text-pink-500">ค่าใช้จ่ายรวม : </span>
                    {`${new Intl.NumberFormat().format(
                      TotalIncomeAndExpense?.sumExpense
                    )}`}
                  </p>
                </div>
                <Line
                  data={incomeAndExpense}
                  options={{
                    fill: true,
                  }}
                />
              </>
            )}
          </figure>
        </div>
        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg lg:col-span-5 flex flex-col">
          <h2 className="card-title my-2">สรุปยอดเก็บเงิน</h2>
          {selectTimeline(fetchIncome)}
          <figure className="h-full mt-3">
            {incomeData && StackedBarChart(incomeData)}
          </figure>
        </div>

        <div className="col-span-8 bg-base-100 shadow-xl p-5 overflow-y-auto rounded-lg lg:col-span-3 flex flex-col">
          <h2 className="card-title my-2">ยอดค้างรับ</h2>
          {selectTimeline(fetchWaitToPlay)}
          <div className="overflow-y-scroll no-scrollbar h-72 mt-3 md:h-48 lg:h-64 xl:h-72 2xl:h-96">
            {waitToPay?.data?.length > 0 ? (
              <>
                {waitToPay.data.map((item, index) => (
                  <div key={index} className="border-b py-2">
                    <div className="flex justify-between items-center p-1">
                      <div className="flex flex-col">
                        <div className="text-sm">
                          <span>
                            {item.customer ? item.customer : "ลูกค้า-หน้าร้าน"}
                          </span>
                          <span className="ml-1 rounded-3xl p-1 text-secondary">
                            {item.status}
                          </span>
                        </div>
                        <div>{item.doc_type}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm ${
                            moment(item.doc_month, "DD-MM-YYYY").format(
                              "DD-MM-yyyy"
                            ) > moment().format("DD-MM-yyyy")
                              ? "text-error"
                              : ""
                          }`}
                        >
                          {item.doc_month}
                        </div>
                        <div>{new Intl.NumberFormat().format(item.total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center">ไม่มีข้อมูล</div>
            )}
          </div>
        </div>

        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg lg:col-span-5">
          <h2 className="card-title my-2">สรุปยอดชำระเงิน</h2>
          {selectTimeline(fetchExpense)}
          <figure className="h-full mt-3 ">
            {expenseData && StackedBarChart(expenseData)}
          </figure>
        </div>
        <div className="col-span-8 rounded-lg bg-base-100 p-5 shadow-xl lg:col-span-3">
          <h2 className="card-title my-2">ค่าใช้จ่ายตามหมวดหมู่</h2>

          {selectTimeline(fetchExpenseByCategory)}

          <figure className="h-full px-10 mt-3 max-w-96 mx-auto ">
            {expenseTypeData ? (
              <Doughnut data={expenseTypeData} />
            ) : (
              <div className="text-center mt-5">ไม่มีข้อมูล</div>
            )}
          </figure>
        </div>
        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg lg:col-span-4">
          <h2 className="card-title my-2">ค่าใช้จ่ายสั่งซื้อสินค้า</h2>
          <form onSubmit={handleSubmitBuyProduct}>
            <div className="flex justify-between gap-2  mb-3">
              <div className="flex flex-col ">
                <label className="col-sm-2 col-form-label text-sm">
                  เริ่มต้น
                </label>
                <div className="col-sm-5">
                  <input
                    type="date"
                    className="form-control max-w-32 border rounded-md px-2 py-1 "
                    value={buyProductDateRanges.startDate}
                    onChange={(e) =>
                      setBuyProductDataDateRanges({
                        ...buyProductDateRanges,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col ">
                <label className="col-sm-2 col-form-label text-sm">
                  สิ้นสุด
                </label>
                <div className="col-sm-5">
                  <input
                    type="date"
                    className="form-control max-w-32 border rounded-md px-2 py-1"
                    value={buyProductDateRanges.endDate}
                    onChange={(e) =>
                      setBuyProductDataDateRanges({
                        ...buyProductDateRanges,
                        endDate: e.target.value,
                      })
                    }
                  />
                  <span className="text-danger"> </span>
                </div>
              </div>
              <div className="">
                <label className="col-sm-2 col-form-label"></label>
                <div className="col-sm-5">
                  <button className="btn btn-primary mt-3"> ค้นหา </button>
                </div>
              </div>
            </div>
          </form>
          <figure className="overflow-y-auto no-scrollbar max-h-96">
            {buyProductData?.length > 0 ? (
              <ul>
                <hr />
                {buyProductData.map((item, index) => (
                  <li key={index} className="border-b py-2">
                    <div className="flex justify-between items-center p-1">
                      <div className="flex flex-col">
                        <div className="text-sm">
                          {item.lot_number}
                          <span className="bg-primary text-primary-content ml-2 rounded-md p-1">
                            {item.product_id}
                          </span>
                        </div>
                        <div className="mt-2">
                          {"ราคาทุน : " +
                            item.lot_price +
                            "  จำนวน : " +
                            item.lot_total}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="hidden sm:block">
                          {item.product_name}
                        </div>
                        <div>
                          {new Intl.NumberFormat().format(item.sumLot)} บาท
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className=" text-center">ไม่มีข้อมูล</div>
            )}
          </figure>
        </div>
        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg lg:col-span-4">
          <h2 className="card-title my-2">ค่าคอมมิสชั่น</h2>
          <form onSubmit={handleSubmitCommition}>
            <div className="flex justify-between gap-2 mb-3 ">
              <div className="flex flex-col ">
                <label className="col-sm-2 col-form-label text-sm">
                  เริ่มต้น
                </label>
                <div className="col-sm-5">
                  <input
                    type="date"
                    className="form-control max-w-32 border rounded-md px-2 py-1"
                    value={commitionDateRanges.startDate}
                    onChange={(e) =>
                      setCommitionDateRanges({
                        ...commitionDateRanges,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col ">
                <label className="col-sm-2 col-form-label text-sm">
                  สิ้นสุด
                </label>
                <div className="col-sm-5">
                  <input
                    type="date"
                    className="form-control max-w-32 border rounded-md px-2 py-1"
                    value={commitionDateRanges.endDate}
                    onChange={(e) =>
                      setCommitionDateRanges({
                        ...commitionDateRanges,
                        endDate: e.target.value,
                      })
                    }
                  />
                  <span className="text-danger"> </span>
                </div>
              </div>
              <div className="mb-4 ">
                <label className="col-sm-2 col-form-label"></label>
                <div className="col-sm-5">
                  <button className="btn btn-primary mt-3"> ค้นหา </button>
                </div>
              </div>
            </div>
          </form>
          <figure className="overflow-y-auto no-scrollbar max-h-96">
            {Commition?.length > 0 ? (
              <ul>
                {Commition.map((item, index) => (
                  <li key={index} className="border-b py-2">
                    <div className="flex justify-between items-center p-1">
                      <div className="flex flex-col">
                        <div className="text-sm">{item.employee_id}</div>
                        <div>
                          {item.employee_fname + " " + item.employee_lname}
                        </div>
                      </div>
                      <div>
                        {" "}
                        {new Intl.NumberFormat().format(
                          item.total_commission
                        )}{" "}
                        บาท
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className=" text-center">ไม่มีข้อมูล</div>
            )}
          </figure>
        </div>
        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg lg:col-span-8">
          <h2 className="card-title my-2">รายงานสินค้าขายดี</h2>

          <figure className="h-full mt-3 ">
            <form onSubmit={handleSubmitTopSale}>
              <div className="flex flex-wrap justify-start gap-2">
                <div>
                  <label className="col-sm-2 col-form-label text-sm">
                    เริ่มต้น
                  </label>
                  <div className="col-sm-5">
                    <input
                      type="date"
                      className="form-control border rounded-md px-2 py-1"
                      value={DateRanges.startDate}
                      onChange={(e) =>
                        setDateRanges({
                          ...DateRanges,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="col-sm-2 col-form-label text-sm">
                    สิ้นสุด
                  </label>
                  <div className="col-sm-5">
                    <input
                      type="date"
                      className="form-control border rounded-md px-2 py-1"
                      value={DateRanges.endDate}
                      onChange={(e) =>
                        setDateRanges({
                          ...DateRanges,
                          endDate: e.target.value,
                        })
                      }
                    />
                    <span className="text-danger"> </span>
                  </div>
                </div>

                <div>
                  <label className="col-sm-2 col-form-label text-sm">
                    ประเภทสินค้า
                  </label>
                  <div className="col-sm-5">
                    <select
                      className=" w-full border rounded-md px-2 py-1"
                      value={DateRanges.selectCategory}
                      onChange={(e) =>
                        setDateRanges({
                          ...DateRanges,
                          selectCategory: e.target.value,
                        })
                      }
                    >
                      <option value="ทั้งหมด">ทั้งหมด</option>
                      {categoryProduct &&
                        categoryProduct.map((op) => (
                          <option key={op.type_id} value={op.type_id}>
                            {op.type_category}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4 ">
                  <label className="col-sm-2 col-form-label"></label>
                  <div className="col-sm-5">
                    <button className="btn btn-primary mt-3"> ค้นหา </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="overflow-auto max-h-96">
              <table className="table">
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>รหัส</th>
                    <th>ชื่อสินค้า</th>
                    <th>ราคาขาย</th>
                    <th>จำนวนที่ขายได้</th>
                    <th>ยอดขายทั้งหมด</th>
                  </tr>
                </thead>
                <tbody>
                  {TopSale?.length > 0 ? (
                    TopSale.map((list, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          {list.product_id}{" "}
                          <img
                            src={`http://localhost:3001/img/product/${list.product_img}`}
                            alt={list.product_name}
                            className="w-10 h-10 mx-auto"
                          />
                        </td>
                        <td>{list.product_name}</td>
                        <td className="text-right">
                          {new Intl.NumberFormat().format(list.product_price)}
                        </td>
                        <td className="text-center">
                          {list.total_quantity_sold}
                        </td>
                        <td className="text-right">
                          {new Intl.NumberFormat().format(
                            list.total_sales_amount
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        ยังไม่มีรายงาน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </figure>
        </div>

        <div className="col-span-8 bg-base-100 shadow-xl p-5 rounded-lg md:col-span-8">
          <h2 className="card-title my-2">ยอดขายตามสินค้า</h2>
          <form onSubmit={handleSubmitSaleProduct}>
            <div className="flex flex-wrap justify-start gap-2">
              <div>
                <label className="col-sm-2 col-form-label text-sm">
                  เริ่มต้น
                </label>
                <div className="col-sm-5">
                  <input
                    type="date"
                    className="form-control border rounded-md px-2 py-1"
                    value={saleProductDateRanges.startDate}
                    onChange={(e) =>
                      setSaleProductDateRanges({
                        ...saleProductDateRanges,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="col-sm-2 col-form-label text-sm">
                  สิ้นสุด
                </label>
                <div className="col-sm-5">
                  <input
                    type="date"
                    className="form-control border rounded-md px-2 py-1"
                    value={saleProductDateRanges.endDate}
                    onChange={(e) =>
                      setSaleProductDateRanges({
                        ...saleProductDateRanges,
                        endDate: e.target.value,
                      })
                    }
                  />
                  <span className="text-danger"> </span>
                </div>
              </div>
              <div>
                <label className="col-sm-2 col-form-label text-sm">
                  ประเภทสินค้า
                </label>
                <div className="col-sm-5">
                  <select
                    className=" w-full border rounded-md px-2 py-1"
                    value={saleProductDateRanges.selectCategory}
                    onChange={(e) =>
                      setSaleProductDateRanges({
                        ...saleProductDateRanges,
                        selectCategory: e.target.value,
                      })
                    }
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    {categoryProduct &&
                      categoryProduct.map((op) => (
                        <option key={op.type_id} value={op.type_id}>
                          {op.type_category}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="mb-4 ">
                <label className="col-sm-2 col-form-label"></label>
                <div className="col-sm-5 items-end">
                  <button className="btn btn-primary mt-3">ค้นหา</button>
                </div>
              </div>
            </div>
          </form>
          <figure className="flex justify-center max-h-[30rem] mt-3 sm:min-h-[17rem] lg:min-h-[20rem] xl:min-h-[25rem] 2xl:min-h-[30rem]">
            {CrossTab ? (
              <Line data={CrossTab} options={{ fill: false }} />
            ) : (
              <>
                <hr />
                <div className="text-center my-2">ยังไม่มีข้อมูลรายงาน</div>
                <hr />
              </>
            )}
          </figure>
        </div>
      </main>
    </>
  );
}

export default Dashboard;
