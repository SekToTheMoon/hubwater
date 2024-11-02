import { useEffect } from "react";
import { io } from "socket.io-client";

// Assuming setQuotation, setBill, and setInvoice are passed in as props or are accessible in this scope

const socketUrl = `${import.meta.env.VITE_API_URL}`;

const updateStatus = (prefix, status, id, setStateFn, idKey, statusKey) => {
  setStateFn((oldItems) => {
    const newItems = [...oldItems];
    const index = newItems.findIndex((item) => item[idKey] === id);
    if (index !== -1) {
      newItems[index][statusKey] = status;
    }
    return newItems;
  });
};

const useSocket = (setValues) => {
  useEffect(() => {
    const socket = io(socketUrl);

    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("QT")) {
        updateStatus("QT", status, id, setValues, "qt_id", "qt_status");
      } else if (id.startsWith("BN")) {
        updateStatus("BN", status, id, setValues, "bn_id", "bn_status");
      } else if (id.startsWith("IV")) {
        updateStatus("IV", status, id, setValues, "iv_id", "iv_status");
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);
};

export default useSocket;
