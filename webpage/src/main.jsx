import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./index.css";
import Login from "./Login.jsx";
import Home from "./components/Home.jsx";
import Register from "./components/Register.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Error from "./Error.jsx";
import Sidebar from "./components/Sidebar.jsx";
import All from "./All.jsx";
import E_dep from "./components/edit/E_dep.jsx";
import I_dep from "./components/insert/I_dep.jsx";
import Department from "./components/Department.jsx";
import Employee from "./components/Employee.jsx";
import I_emp from "./components/insert/I_emp.jsx";
import Edit_emp from "./components/edit/Edit_emp.jsx";
import Position from "./components/Position.jsx";
import E_posit from "./components/edit/E_posit.jsx";
import I_posit from "./components/insert/I_posit.jsx";
import Brand from "./components/Brand.jsx";
import E_brand from "./components/edit/E_brand.jsx";
import I_brand from "./components/insert/I_brand.jsx";
import Type from "./components/Type.jsx";
import I_type from "./components/insert/I_type.jsx";
import E_type from "./components/edit/E_type.jsx";
import Unit from "./components/Unit.jsx";
import I_unit from "./components/insert/I_unit.jsx";
import E_unit from "./components/edit/E_unit.jsx";
import Unit_m from "./components/Unit_m.jsx";
import I_unit_m from "./components/insert/I_unit_m.jsx";
import E_unit_m from "./components/edit/E_unit_m.jsx";
import Expensetype from "./components/Expensetype.jsx";
import I_expensetype from "./components/insert/I_expensetype.jsx";
import E_expensetype from "./components/edit/E_expensetype.jsx";
import Quotation from "./components/Quotation.jsx";
import View_quotation from "./components/views/View_quotation.jsx";
import I_quotation from "./components/insert/I_quotation.jsx";
import E_quotation from "./components/edit/E_quotation.jsx";
import Customer from "./components/customer.jsx";
import I_customer from "./components/insert/I_customer.jsx";
import E_customer from "./components/edit/E_customer.jsx";
import Product from "./components/product.jsx";
import I_product from "./components/insert/I_product.jsx";
import E_product from "./components/edit/E_product.jsx";
import Stock from "./components/stock/Stock.jsx";
import Bank from "./components/Bank.jsx";
import I_bank from "./components/insert/I_bank.jsx";
import E_bank from "./components/edit/E_bank.jsx";
import Bill from "./components/Bill.jsx";
import I_bill from "./components/insert/I_bill.jsx";
import E_bill from "./components/edit/E_bill.jsx";
import Receipt from "./components/Receipt.jsx";
import I_receipt from "./components/insert/I_receipt.jsx";
import View_receipt from "./components/views/View_receipt.jsx";
import Invoice from "./components/Invoice.jsx";
import I_invoice from "./components/insert/I_invoice.jsx";
import E_invoice from "./components/edit/E_invoice.jsx";
import View_invoice from "./components/views/View_invoice.jsx";
import Testimg from "./components/Testimg.jsx";
import View_bill from "./components/views/View_bill.jsx";
import Out from "./components/Out.jsx";
import I_out from "./components/insert/I_out.jsx";
import E_out from "./components/edit/E_out.jsx";
import View_out from "./components/views/View_out.jsx";
import ReceiptCash from "./components/ReceiptCash.jsx";
import I_receiptcash from "./components/insert/I_receiptcash.jsx";
import E_receiptcash from "./components/edit/E_receiptcash.jsx";
import View_receiptcash from "./components/views/View_receiptcash.jsx";
import Company from "./components/Company.jsx";
import { AuthProvider } from "./context/authProvider.jsx";
import RequireAuth from "./context/requireAuth.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/test" element={<Testimg />} />
          <Route path="/register" element={<Register />} />
          <Route path="home" element={<All />}>
            <Route index element={<Home />} />
          </Route>
          <Route element={<RequireAuth allowedPermission={1} />}>
            <Route path="dashboard" element={<All />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={2} />}>
            <Route path="employee" element={<All />}>
              <Route index element={<Employee />} />
              <Route path="insert" element={<I_emp />} />
              <Route path="edit/:id" element={<Edit_emp />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={3} />}>
            <Route path="customer" element={<All />}>
              <Route index element={<Customer />} />
              <Route path="insert" element={<I_customer />} />
              <Route path="edit/:id" element={<E_customer />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={4} />}>
            <Route path="quotation" element={<All />}>
              <Route index element={<Quotation />} />
              <Route path="insert" element={<I_quotation />} />
              <Route path="view/:id" element={<View_quotation />} />
              <Route path="edit/:id" element={<E_quotation />} />
            </Route>
            <Route path="bill" element={<All />}>
              <Route index element={<Bill />} />
              <Route path="insert" element={<I_bill />} />
              <Route path="view/:id" element={<View_bill />} />
              <Route path="edit/:id" element={<E_bill />} />
            </Route>
            <Route path="invoice" element={<All />}>
              <Route index element={<Invoice />} />
              <Route path="insert" element={<I_invoice />} />
              <Route path="view/:id" element={<View_invoice />} />
              <Route path="edit/:id" element={<E_invoice />} />
            </Route>
            <Route path="receipt" element={<All />}>
              <Route index element={<Receipt />} />
              <Route path="insert" element={<I_receipt />} />
              <Route path="view" element={<View_receipt />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={5} />}>
            <Route path="receiptcash" element={<All />}>
              <Route index element={<ReceiptCash />} />
              <Route path="insert" element={<I_receiptcash />} />
              <Route path="edit/:id" element={<E_receiptcash />} />
              <Route path="view/:id" element={<View_receiptcash />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={6} />}>
            <Route path="out" element={<All />}>
              <Route index element={<Out />} />
              <Route path="insert" element={<I_out />} />
              <Route path="edit/:id" element={<E_out />} />
              <Route path="view/:id" element={<View_out />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={7} />}>
            <Route path="product" element={<All />}>
              <Route index element={<Product />} />
              <Route path="insert" element={<I_product />} />
              <Route path="edit/:id" element={<E_product />} />
              <Route path="stock/:id" element={<Stock />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={8} />}>
            <Route path="brand" element={<All />}>
              <Route index element={<Brand />} />
              <Route path="insert" element={<I_brand />} />
              <Route path="edit/:id" element={<E_brand />} />
            </Route>
            <Route path="type" element={<All />}>
              <Route index element={<Type />} />
              <Route path="insert" element={<I_type />} />
              <Route path="edit/:id" element={<E_type />} />
            </Route>
            <Route path="unit" element={<All />}>
              <Route index element={<Unit />} />
              <Route path="insert" element={<I_unit />} />
              <Route path="edit/:id" element={<E_unit />} />
            </Route>
            <Route path="unit_m" element={<All />}>
              <Route index element={<Unit_m />} />
              <Route path="insert" element={<I_unit_m />} />
              <Route path="edit/:id" element={<E_unit_m />} />
            </Route>
            <Route path="expensetype" element={<All />}>
              <Route index element={<Expensetype />} />
              <Route path="insert" element={<I_expensetype />} />
              <Route path="edit/:id" element={<E_expensetype />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={9} />}>
            <Route path="company" element={<All />}>
              <Route index element={<Company />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={10} />}>
            <Route path="department" element={<All />}>
              <Route index element={<Department />} />
              <Route path="insert" element={<I_dep />} />
              <Route path="edit/:id" element={<E_dep />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={11} />}>
            <Route path="position" element={<All />}>
              <Route index element={<Position />} />
              <Route path="insert" element={<I_posit />} />
              <Route path="edit/:id" element={<E_posit />} />
            </Route>
          </Route>
          <Route element={<RequireAuth allowedPermission={12} />}>
            <Route path="bank" element={<All />}>
              <Route index element={<Bank />} />
              <Route path="insert" element={<I_bank />} />
              <Route path="edit/:id" element={<E_bank />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
