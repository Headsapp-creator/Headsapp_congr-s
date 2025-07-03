
import {React} from "react";
import { Box, SimpleGrid } from "@chakra-ui/react";
import DevelopmentTable from "views/admin/dataTables/components/DevelopmentTable";
import CheckTable from "views/admin/dataTables/components/CheckTable";
// eslint-disable-next-line no-lone-blocks
/*import ColumnsTable from "views/admin/dataTables/components/ColumnsTable";
import ComplexTable from "views/admin/dataTables/components/ComplexTable";
import {
  columnsDataColumns,
  columnsDataComplex,
} from "views/admin/dataTables/variables/columnsData";

import tableDataColumns from "views/admin/dataTables/variables/tableDataColumns.json";
import tableDataComplex from "views/admin/dataTables/variables/tableDataComplex.json";*/


export default function Settings() {
   
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SimpleGrid
        mb="20px"
        // Use gridTemplateColumns for custom width ratios
        gridTemplateColumns={{ base: "1fr", md: "2fr 1fr" }}
        spacing={{ base: "20px", xl: "20px" }}>


        <DevelopmentTable/>
        <CheckTable  />

        {/*<ColumnsTable
          columnsData={columnsDataColumns}
          tableData={tableDataColumns}
        />
        <ComplexTable
          columnsData={columnsDataComplex}
          tableData={tableDataComplex}
        />*/}
      </SimpleGrid> 
    </Box>
  );
}
