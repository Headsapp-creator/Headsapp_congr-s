  import { FaEye, FaUserPlus, FaDownload, FaTrash, FaFileAlt, } from "react-icons/fa";
import { MdTrackChanges } from "react-icons/md";
  import { IconButton, Checkbox as ChakraCheckbox } from "@chakra-ui/react";
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

    // Tracking modal state
    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [trackingData, setTrackingData] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [trackingForId, setTrackingForId] = useState(null);

    // File action modal state
    const [fileActionModalOpen, setFileActionModalOpen] = useState(false);
    const [fileActionFor, setFileActionFor] = useState(null);

    // Abstract visualization modal state
    const [abstractModalOpen, setAbstractModalOpen] = useState(false);
    const [abstractData, setAbstractData] = useState(null);

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

    // Tracking modal logic
    const handleOpenTrackingModal = async (communicationId) => {
      setTrackingForId(communicationId);
      const res = await fetch(`http://localhost:5000/communications/${communicationId}/tracking`);
      const data = await res.json();
      setTrackingData(data);
      setTrackingModalOpen(true);
    };

    // File action modal logic
    const handleOpenFileActionModal = (row) => {
      setFileActionFor(row);
      setFileActionModalOpen(true);
    };

    // Abstract visualization modal logic
    const handleOpenAbstractModal = (row) => {
      setAbstractData(row);
      setAbstractModalOpen(true);
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
      columnHelper.accessor('mainAuthor', {
        id: 'author',
        header: () => <Text color="gray.700" fontWeight="bold">Author</Text>,
        cell: (info) => {
          const value = info.getValue();
          let displayName = "";
          if (typeof value === "string") {
            displayName = value;
          } else if (value && typeof value === "object") {
            displayName = `${value.prenom || ""} ${value.nom || ""}`.trim();
          }
          return (
            <Box>
              <Text color={textColor} fontSize="sm">
                {displayName}
              </Text>
              <Text color={grayColor} fontSize="xs">
                {info.row.original.coAuthors}
              </Text>
            </Box>
          );
        },
      }),
      columnHelper.accessor('committeeMembers', {
        id: 'reviewers',
        header: () => <Text color="gray.700" fontWeight="bold">Reviewers & Scores</Text>,
        cell: (info) => {
          const members = info.row.original.committeeMembers || [];
          const scores = info.row.original.scores || [];
          return (
            <Box>
              {members.length === 0 ? (
                <Text color="gray.400" fontSize="xs">—</Text>
              ) : (
                members.map((m, idx) => {
                  const score = scores[idx];
                  let bg = "orange.200";
                  let label = "Pending";
                  if (score !== null && score !== undefined) {
                    if (score >= 8) {
                      bg = "green.200";
                      label = score;
                    } else if (score >= 5) {
                      bg = "orange.200";
                      label = score;
                    } else {
                      bg = "red.200";
                      label = score;
                    }
                  }
                  return (
                    <Box
                      key={idx}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      borderBottom={idx < members.length - 1 ? "1px solid #eee" : "none"}
                      py={1}
                    >
                      <Box flex="1">
                        <Text color="secondaryGray.900" fontSize="sm" display="inline">{`${m.prenom} ${m.nom}`}</Text>
                        <Text color="gray.400" fontSize="xs" display="inline" ml={2}>{m.email}</Text>
                      </Box>
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
                        {label}
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
          const members = info.row.original.committeeMembers || [];
          const allScored = scores.length === members.length && scores.every(s => s !== null && s !== undefined);
          let avg = 0;
          if (allScored && scores.length) {
            avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            avg = Math.min(avg, 10);
          }
          let bg = "orange.200";
          let label = "Pending";
          if (allScored && scores.length) {
            if (avg >= 8) {
              bg = "green.200";
              label = avg.toFixed(2);
            } else if (avg >= 5) {
              bg = "orange.200";
              label = avg.toFixed(2);
            } else {
              bg = "red.200";
              label = avg.toFixed(2);
            }
          }
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
              {label}
            </Box>
          );
        },
      },
      {
        id: 'actions',
        header: () => <Text color="gray.700" fontWeight="bold">Actions</Text>,
        cell: (info) => (
          <Box display="flex" gap={2}>
            <IconButton
              aria-label="Tracking"
              icon={<MdTrackChanges/>}
              size="sm"
              variant="ghost"
              colorScheme="purple"
              onClick={() => handleOpenTrackingModal(info.row.original.id)}
            />
            <IconButton
              aria-label="Document Actions"
              icon={<FaFileAlt />}
              size="sm"
              variant="ghost"
              colorScheme="teal"
              onClick={() => handleOpenFileActionModal(info.row.original)}
            />
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
        {/* Assign Committee Modal */}
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
        {/* Tracking Modal */}
        <Modal isOpen={trackingModalOpen} onClose={() => setTrackingModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reviewer Tracking</ModalHeader>
            <ModalBody>
              {trackingData.length === 0 ? (
                <Text>No tracking data available.</Text>
              ) : (
                <Stack>
                  {trackingData.map((item, idx) => (
                    <Box key={idx} p={2} borderBottom="1px solid #eee">
                      <Text fontWeight="bold">{item.reviewer.prenom} {item.reviewer.nom} ({item.reviewer.email})</Text>
                      <Text fontSize="sm" color={item.viewed ? "green.600" : "gray.500"}>
                        Viewed: {item.viewed ? `Yes (${item.viewedAt ? new Date(item.viewedAt).toLocaleString() : ""})` : "No"}
                      </Text>
                      <Text fontSize="sm" color={item.downloaded ? "blue.600" : "gray.500"}>
                        Downloaded: {item.downloaded ? `Yes (${item.downloadedAt ? new Date(item.downloadedAt).toLocaleString() : ""})` : "No"}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setTrackingModalOpen(false)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* File Action Modal */}
        <Modal isOpen={fileActionModalOpen} onClose={() => setFileActionModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Document Actions</ModalHeader>
            <ModalBody>
              <Stack>
                <Button
                  leftIcon={<FaEye />}
                  colorScheme="blue"
                  onClick={() => {
                    setFileActionModalOpen(false);
                    handleOpenAbstractModal(fileActionFor);
                  }}
                >
                  Visualize
                </Button>
                <Button
                  leftIcon={<FaDownload />}
                  colorScheme="green"
                  onClick={() => {
                    window.open(`http://localhost:5000/communications/download/${fileActionFor.id}`, "_blank");
                    setFileActionModalOpen(false);
                  }}
                >
                  Download
                </Button>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setFileActionModalOpen(false)}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Abstract Visualization Modal */}
        <Modal isOpen={abstractModalOpen} onClose={() => setAbstractModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent maxW="800px" maxH="90vh">
            <ModalHeader>Abstract Details</ModalHeader>
            <ModalBody overflowY="auto" maxH="75vh">
              {abstractData && (
                <Box p={4}>
                  <Box mb={6}>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600" mb={2}>
                      {abstractData.title}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Speciality:</strong> {abstractData.speciality}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Type:</strong> {abstractData.typeOfAbstract}
                    </Text>
                  </Box>
                  
                  <Box mb={6}>
                    <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.700">
                      Author Information
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Main Author:</strong> {abstractData.mainAuthor}
                    </Text>
                    {abstractData.coAuthors && abstractData.coAuthors.length > 0 && (
                      <Text fontSize="md" color="gray.600">
                        <strong>Co-Authors:</strong> {abstractData.coAuthors}
                      </Text>
                    )}
                    <Text fontSize="md" color="gray.600">
                      <strong>Email:</strong> {abstractData.email}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Phone:</strong> {abstractData.phone || "N/A"}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Service:</strong> {abstractData.service}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Institution:</strong> {abstractData.institution || "N/A"}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>Country:</strong> {abstractData.pays || "N/A"}
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      <strong>City:</strong> {abstractData.ville || "N/A"}
                    </Text>
                  </Box>
                  
                  <Box mb={6}>
                    <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.700">
                      Communication Content
                    </Text>
{abstractData.introduction && (
                        <Box mb={4}>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={1}>
                            Introduction
                          </Text>
                          <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              {abstractData.introduction}
                            </Text>
                          </Box>
                        </Box>
                      )}
                      {abstractData.casePresentation && (
                        <Box mb={4}>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={1}>
                            Case Presentation
                          </Text>
                          <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              {abstractData.casePresentation}
                            </Text>
                          </Box>
                        </Box>
                      )}
                      {abstractData.methods && (
                        <Box mb={4}>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={1}>
                            Methods
                          </Text>
                          <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              {abstractData.methods}
                            </Text>
                          </Box>
                        </Box>
                      )}
                      {abstractData.results && (
                        <Box mb={4}>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={1}>
                            Results
                          </Text>
                          <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              {abstractData.results}
                            </Text>
                          </Box>
                        </Box>
                      )}
                      {abstractData.conclusion && (
                        <Box mb={4}>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={1}>
                            Conclusion
                          </Text>
                          <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              {abstractData.conclusion}
                            </Text>
                          </Box>
                        </Box>
                      )}
                  </Box>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setAbstractModalOpen(false)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  }