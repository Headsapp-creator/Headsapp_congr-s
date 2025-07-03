import { FaEye, FaUserPlus, FaDownload, FaTrash } from "react-icons/fa";
import { IconButton, Link, Checkbox as ChakraCheckbox } from "@chakra-ui/react";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Box,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import React, { useState } from 'react';

const columnHelper = createColumnHelper();

export default function Documents(props) {
  const { tableData } = props;
  const [sorting, setSorting] = React.useState([]);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const grayColor = useColorModeValue('gray.400', 'gray.500');
  let defaultData = tableData || [];
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [assigningForId, setAssigningForId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [data, setData] = React.useState(() => [...defaultData]);

  React.useEffect(() => {
    setData([...defaultData]);
    setSelectedRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  const handleOpenAssignModal = (communicationId, assigned) => {
    setAssigningForId(communicationId);
    fetch("http://localhost:5000/communications/committee-members")
      .then(res => res.json())
      .then(data => setCommitteeMembers(data));
    setSelectedReviewers(assigned || []);
    onOpen();
  };

 const handleSelectAll = (checked) => {
  if (checked) {
    setSelectedRows(data.map(row => row.id));
  } else {
    setSelectedRows([]);
  }
};

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleAssignReviewers = () => {
    fetch(`http://localhost:5000/communications/${assigningForId}/assign-reviewers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerIds: selectedReviewers }),
    })
      .then(res => res.json())
      .then(() => {
        onClose();
        window.location.reload();
      });
  };

  const columns = [
    {
  id: 'select',
  header: () => (
    <ChakraCheckbox
      isChecked={selectedRows.length === data.length && data.length > 0}
      isIndeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
      onChange={e => handleSelectAll(e.target.checked)}
    />
  ),
  cell: (info) => (
    <ChakraCheckbox
      isChecked={selectedRows.includes(info.row.original.id)}
      onChange={e => handleSelectRow(info.row.original.id, e.target.checked)}
    />
  ),
},
    columnHelper.accessor('title', {
      id: 'title',
      header: () => <Text color="gray.700" fontWeight="bold">Title</Text>,
      cell: (info) => (
        <Box>
          <Text color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}
          </Text>
          <Text color={grayColor} fontSize="xs">
            {info.row.original.id?.substring(0, 8)}...
          </Text>
        </Box>
      ),
    }),
    columnHelper.accessor('user', {
      id: 'author',
      header: () => <Text color="gray.700" fontWeight="bold">Author</Text>,
      cell: (info) => (
        <Box>
          <Text color={textColor} fontSize="sm">
            {`${info.getValue()?.prenom || ""} ${info.getValue()?.nom || ""}`}
          </Text>
          <Text color={grayColor} fontSize="xs">
            {info.row.original.coAuthors}
          </Text>
        </Box>
      ),
    }),
    columnHelper.accessor('committeeMembers', {
      id: 'reviewers',
      header: () => <Text color="gray.700" fontWeight="bold">Reviewers</Text>,
      cell: (info) => {
        const members = info.row.original.committeeMembers || [];
        return (
          <Box>
            {members.length === 0 ? (
              <Text color={grayColor} fontSize="xs">—</Text>
            ) : (
              members.map((m, idx) => (
                <Box key={idx}>
                  <Text color={textColor} fontSize="sm" display="inline">{`${m.prenom} ${m.nom}`}</Text>
                  <Text color={grayColor} fontSize="xs" display="inline" ml={2}>{m.email}</Text>
                </Box>
              ))
            )}
          </Box>
        );
      },
    }),
    columnHelper.accessor('scores', {
  id: 'scores',
  header: () => <Text color="gray.700" fontWeight="bold">Scores</Text>,
  cell: (info) => {
    const scores = info.row.original.scores || [];
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        {scores.length === 0 ? (
          <Text color={grayColor} fontSize="xs">—</Text>
        ) : (
          scores.map((s, idx) => {
            let bg = "red.200";
            if (s >= 8 && s <= 10) bg = "green.200";
            else if (s >= 5 && s < 8) bg = "orange.200";
            const displayScore = Math.min(s, 10);
            return (
              <Box key={idx} display="flex" alignItems="center" gap={2}>
                <Box
                  px={2}
                  py={1}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.300"
                  bg={bg}
                  minW="32px"
                  textAlign="center"
                  fontWeight="bold"
                  color="black"
                >
                  {displayScore}
                </Box>
                
              </Box>
            );
          })
        )}
      </Box>
    );
  },
}),
    {
      id: 'averageScore',
      header: () => <Text color="gray.700" fontWeight="bold">Average</Text>,
      cell: (info) => {
        const scores = info.row.original.scores || [];
        if (!scores.length) {
          return (
            <Box
              px={2}
              py={1}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.300"
              bg="orange.200"
              minW="32px"
              textAlign="center"
              fontWeight="bold"
              color="black"
            >
              Pending
            </Box>
          );
        }
        let avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        avg = Math.min(avg, 10);
        let bg = "red.200";
        if (avg >= 8 && avg <= 10) bg = "green.200";
        else if (avg >= 5 && avg < 8) bg = "orange.200";
        return (
          <Box
            px={2}
            py={1}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300"
            bg={bg}
            minW="32px"
            textAlign="center"
            fontWeight="bold"
            color="black"
          >
            {avg.toFixed(2)}
          </Box>
        );
      },
    },
    {
      id: 'actions',
      header: () => <Text color="gray.700" fontWeight="bold">Actions</Text>,
      cell: (info) => (
        <Box display="flex" gap={2}>
          <Link href={info.row.original.filePath} target="_blank">
            <IconButton
              aria-label="View Document"
              icon={<FaEye />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
            />
          </Link>
          <a
            href={`http://localhost:5000/communications/download/${info.row.original.id}`}
            style={{ display: "inline-block" }}
          >
            <IconButton
              aria-label="Download Document"
              icon={<FaDownload />}
              size="sm"
              variant="ghost"
              colorScheme="green"
            />
          </a>
          <IconButton
            aria-label="Add Committee"
            icon={<FaUserPlus />}
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAssignModal(
              info.row.original.id,
              (info.row.original.committeeMembers || []).map(m => m.id)
            )}
          />
          <IconButton
            aria-label="Delete Communication"
            icon={<FaTrash />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete this communication?")) {
                await fetch("http://localhost:5000/communications/delete-bulk", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ids: [info.row.original.id] }),
                });
                window.location.reload();
              }
            }}
          />
        </Box>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <Box w="100%" overflowX="auto" bg="white" borderRadius="md" boxShadow="md" p={6} mb={8}>
      {selectedRows.length > 0 && (
  <Box mb={4} display="flex" gap={2} alignItems="center">
    <Text fontWeight="bold">{selectedRows.length} selected</Text>
    <IconButton
      aria-label="Download Selected"
      icon={<FaDownload />}
      size="sm"
      colorScheme="green"
      onClick={() => {
        selectedRows.forEach(id => {
          window.open(`http://localhost:5000/communications/download/${id}`, "_blank");
        });
      }}
    />
    <IconButton
      aria-label="Assign Committee"
      icon={<FaUserPlus />}
      size="sm"
      colorScheme="blue"
      onClick={() => {
        handleOpenAssignModal(selectedRows[0], []);
      }}
    />
    <IconButton
      aria-label="Delete Selected"
      icon={<FaTrash />}
      size="sm"
      colorScheme="red"
      onClick={async () => {
        if (window.confirm("Are you sure you want to delete the selected communications?")) {
          await fetch("http://localhost:5000/communications/delete-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows }),
          });
          window.location.reload();
        }
      }}
    />
  </Box>
)}
      <Table
        variant="simple"
        color="gray.500"
        mb="24px"
        mt="12px"
        sx={{
          'thead tr': {
            borderBottom: '2px solid',
            borderBottomColor: 'gray.200'
          },
          'th': {
            fontWeight: 'bold',
            color: 'gray.700',
            py: 3,
            px: 4,
            fontSize: 'md',
            textAlign: 'left',
            bg: 'gray.100',
            borderRadius: 'md'
          },
          'td': {
            py: 4,
            px: 4,
            borderBottom: '1.5px solid',
            borderBottomColor: 'gray.200'
          },
          'tr:not(:last-child)': {
            borderBottom: '1.5px solid',
            borderBottomColor: 'gray.200'
          }
        }}
      >
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th
                  key={header.id}
                  colSpan={header.colSpan}
                  cursor="pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : header.column.columnDef.header()}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row) => (
            <Tr key={row.original.id}>
  {row.getVisibleCells().map((cell) => (
    <Td key={cell.id}>
      {cell.column.columnDef.cell(cell.getContext())}
    </Td>
  ))}
</Tr>
          ))}
        </Tbody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Committee Members</ModalHeader>
          <ModalBody>
            <CheckboxGroup
              value={selectedReviewers}
              onChange={setSelectedReviewers}
            >
              <Stack>
                {committeeMembers.map(member => (
                  <Checkbox key={member.id} value={member.id}>
                    {member.prenom} {member.nom} ({member.email})
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAssignReviewers} isDisabled={selectedReviewers.length === 0}>
              Assign
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
  
}
