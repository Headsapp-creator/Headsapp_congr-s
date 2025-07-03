'use client';
/* eslint-disable */

import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Flex,
  Progress,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  CheckboxGroup,
  Checkbox,
  Stack,
  Input,
  Textarea,
  Tooltip,
  Icon,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import Card from 'components/card/Card';
import useProgramStore from 'stores/useProgramStore';
import { AuthContext } from 'contexts/AuthContext';
import { ATTRIBUTE_META } from '../variables/attributeMeta';

const CONDITIONAL_FIELDS = [
  { name: "Profession Type", label: "Are you a Doctor or Paramedical?", type: "select", options: ["doctor", "paramedical"] },
  { name: "Etablissement", label: "Etablissement where you work", type: "text" },
  { name: "City", label: "City where you work", type: "text" },
  { name: "Name Of Society", label: "Name of Society", type: "text" }
];

const columnHelper = createColumnHelper();

export default function DevelopmentTable() {
  const { currentUser, fetchUser } = useContext(AuthContext);
  const [tableData, setTableData] = useState([]);
  const [sorting, setSorting] = useState([{ id: 'progress', desc: true }]);
  const [formData, setFormData] = useState({
    nom: '',
    dateDebut: '',
    dateFin: '',
    description: '',
    image: '',
    pricingBySpecialty: {},
    newSpecialty: '',
    workshops: [{
      nom: '',
      description: '',
      capacity: '',
      price: '',
    }],
    activityOptions: ["public", "private", "sponsor"],
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const setSelectedPrograms = useProgramStore((state) => state.setSelectedPrograms);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [attributeConditions, setAttributeConditions] = useState({});
  const [restored, setRestored] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('eventCreationState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.selectedAttributes) setSelectedAttributes(parsed.selectedAttributes);
        if (parsed.attributeConditions) setAttributeConditions(parsed.attributeConditions);
        if (parsed.isOpen) {
          setTimeout(() => onOpen(), 0); 
        }
      } catch (e) {
        console.error('Failed to parse saved event creation state:', e);
      }
    }
        setRestored(true);
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    const stateToSave = {
      formData,
      currentStep,
      selectedAttributes,
      attributeConditions,
      isOpen,
    };
    localStorage.setItem('eventCreationState', JSON.stringify(stateToSave));
  }, [formData, currentStep, selectedAttributes, attributeConditions, isOpen]);

  // Custom close handler to clear localStorage
  const handleClose = () => {
    onClose();
    setCurrentStep(1);
    localStorage.removeItem('eventCreationState');
  };

  // Step 2: Attribute selection and condition setting
  const handleConditionChange = (attrName, field, value) => {
    setAttributeConditions(prev => ({
      ...prev,
      [attrName]: { ...prev[attrName], [field]: value }
    }));
  };
  // --- Pricing Steps Per Specialty Handlers ---
  const handleSpecialtyChange = (e) => {
    setFormData((prev) => ({ ...prev, newSpecialty: e.target.value }));
  };

  const addSpecialty = () => {
    const specialty = formData.newSpecialty.trim();
    if (specialty && !formData.pricingBySpecialty[specialty]) {
      setFormData((prev) => ({
        ...prev,
        pricingBySpecialty: { ...prev.pricingBySpecialty, [specialty]: [{ price: '', deadline: '' }] },
        newSpecialty: '',
      }));
    }
  };

  const removeSpecialty = (specialty) => {
    const updated = { ...formData.pricingBySpecialty };
    delete updated[specialty];
    setFormData((prev) => ({ ...prev, pricingBySpecialty: updated }));
  };

  const handlePricingStepChange = (specialty, idx, field, value) => {
    const updatedSteps = [...formData.pricingBySpecialty[specialty]];
    updatedSteps[idx][field] = value;
    setFormData((prev) => ({
      ...prev,
      pricingBySpecialty: { ...prev.pricingBySpecialty, [specialty]: updatedSteps },
    }));
  };

  const addPricingStep = (specialty) => {
    setFormData((prev) => ({
      ...prev,
      pricingBySpecialty: {
        ...prev.pricingBySpecialty,
        [specialty]: [...prev.pricingBySpecialty[specialty], { price: '', deadline: '' }],
      },
    }));
  };

  const removePricingStep = (specialty, idx) => {
    const updatedSteps = formData.pricingBySpecialty[specialty].filter((_, i) => i !== idx);
    setFormData((prev) => ({
      ...prev,
      pricingBySpecialty: { ...prev.pricingBySpecialty, [specialty]: updatedSteps },
    }));
  };

  const fetchEvents = async () => {
    if (!currentUser) {
      console.error('User is not authenticated');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/events', {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.status === 401) {
        console.error('Unauthorized: Please log in again');
        fetchUser();
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Events API did not return an array:', data);
        setTableData([]);
        return;
      }
      const formattedData = data.map((event) => {
        const price = computeCurrentPrice(event, currentUser?.specialite);
        const pricingSteps = event.pricingSteps && typeof event.pricingSteps === 'object'
          ? event.pricingSteps
          : {};
        return {
          id: event.id,
          name: event.nom,
          status: event.status,
          price,
          pricingSteps,
          date: format(new Date(event.dateDebut), 'MMMM dd, yyyy hh:mm a'),
          progress: event.capacity > 0
            ? Math.round(((event.participantCount || 0) / event.capacity) * 100)
            : 0,
        };
      });
      setTableData(formattedData);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  function computeCurrentPrice(event, specialty) {
    if (event.pricingSteps && typeof event.pricingSteps === 'object') {
      const steps = event.pricingSteps[specialty] || [];
      const now = new Date();
      const sortedSteps = [...steps].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
      for (const step of sortedSteps) {
        if (!step.deadline || now <= new Date(step.deadline)) {
          return step.price;
        }
      }
      return sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1].price : null;
    }
    return null;
  }

  useEffect(() => {
    fetchEvents();
  }, [currentUser, fetchUser]);

  const handleRowClick = async (eventId) => {
    if (!currentUser) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/events/${eventId}/programs`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (response.status === 401) {
        console.error('Unauthorized: Please log in again');
        fetchUser();
        return;
      }

      const programs = await response.json();
      setSelectedPrograms(programs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const handleWorkshopChange = (index, field, value) => {
    const updatedWorkshops = [...formData.workshops];
    if (field === "capacity") {
      updatedWorkshops[index][field] = parseInt(value, 10) || 0;
    } else {
      updatedWorkshops[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, workshops: updatedWorkshops }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addWorkshop = () => {
    setFormData((prev) => ({
      ...prev,
      workshops: [...prev.workshops, {
        nom: '',
        description: '',
        capacity: '',
        price: '',
      }],
    }));
  };

  const removeWorkshop = (index) => {
    const updatedWorkshops = formData.workshops.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, workshops: updatedWorkshops }));
  };

  const handleActivityOptionsChange = (opts) => {
    setFormData((prev) => ({
      ...prev,
      activityOptions: opts,
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      console.error("User is not authenticated");
      return;
    }
    try {
      const attributesToSend = selectedAttributes.map(attr => {
        const meta = ATTRIBUTE_META[attr] || { name: attr, label: attr, type: "text" };
        const cond = attributeConditions[attr];
        return cond && cond.attribute && cond.value
          ? { ...meta, condition: { attribute: cond.attribute, value: cond.value } }
          : meta;
      });
      const response = await fetch("http://localhost:5000/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          pricingSteps: formData.pricingBySpecialty,
          selectedAttributes: attributesToSend,
          activityOptions: formData.activityOptions,
        }),
      });
      if (response.ok) {
        await fetchEvents();
        handleClose();
        setFormData({
          nom: '',
          dateDebut: '',
          dateFin: '',
          description: '',
          image: '',
          pricingBySpecialty: {},
          newSpecialty: '',
          workshops: [{ nom: '', description: '', capacity: '', price: '' }],
          activityOptions: ["public", "private", "sponsor"],
        });
        setSelectedAttributes([]);
        setCurrentStep(1);
      } else {
        const errorData = await response.json();
        console.error("Failed to create event:", errorData);
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const columns = [
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <Text
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          NAME
        </Text>
      ),
      cell: (info) => {
        const row = info.row.original;
        const pricingSteps = row.pricingSteps || {};
        return (
          <Flex align="center">
            <Text color={textColor} fontSize="sm" fontWeight="700">
              {info.getValue()}
            </Text>
            {Object.keys(pricingSteps).length > 0 && (
              <Tooltip
                label={
                  <Box>
                    {Object.entries(pricingSteps).map(([specialty, steps]) => (
                      <Box key={specialty} mb={2}>
                        <Text fontWeight="bold" fontSize="xs" mb={1}>{specialty}</Text>
                        {steps.map((step, idx) => (
                          <Text key={idx} fontSize="xs" ml={2}>
                            {step.deadline
                              ? `Until ${format(new Date(step.deadline), 'yyyy-MM-dd HH:mm')}: ${parseFloat(step.price).toFixed(2)} DT`
                              : `After last deadline: ${parseFloat(step.price).toFixed(2)} DT`}
                          </Text>
                        ))}
                      </Box>
                    ))}
                  </Box>
                }
                aria-label="Pricing steps"
                placement="top"
                hasArrow
                maxW="350px"
              >
                <span>
                  <Icon as={InfoOutlineIcon} color="blue.400" boxSize={4} cursor="pointer" ml={2} />
                </span>
              </Tooltip>
            )}
          </Flex>
        );
      },
    }),
    columnHelper.accessor('date', {
      id: 'date',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          DATE
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          STATUS
        </Text>
      ),
      cell: (info) => (
        <Text color={textColor} fontSize="sm" fontWeight="700">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('progress', {
      id: 'progress',
      header: () => (
        <Text
          justifyContent="space-between"
          align="center"
          fontSize={{ sm: '10px', lg: '12px' }}
          color="gray.400"
        >
          PROGRESS
        </Text>
      ),
      cell: (info) => (
        <Flex align="center">
          <Text me="10px" color={textColor} fontSize="sm" fontWeight="700">
            {info.getValue()}%
          </Text>
          <Progress
            variant="table"
            colorScheme="brandScheme"
            h="8px"
            w="63px"
            value={info.getValue()}
          />
        </Flex>
      ),
      enableSorting: true,
    }),
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  if (!restored) return null;
  return (
    <Card
      flexDirection="column"
      w="100%"
      px="0px"
      overflowX={{ sm: 'scroll', lg: 'hidden' }}
    >
      <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
        <Text
          color={textColor}
          fontSize="22px"
          fontWeight="700"
          lineHeight="100%"
        >
          Events Table
        </Text>
        <Button colorScheme="blue" onClick={onOpen}>
          Create Event
        </Button>
      </Flex>
      <Box>
        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th
                    key={header.id}
                    colSpan={header.colSpan}
                    pe="10px"
                    borderColor={borderColor}
                    cursor="pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Flex
                      justifyContent="space-between"
                      align="center"
                      fontSize={{ sm: '10px', lg: '12px' }}
                      color="gray.400"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Flex>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr
                key={row.id}
                onClick={() => handleRowClick(row.original.id)}
                cursor="pointer"
                _hover={{ bg: 'gray.100' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Td
                    key={cell.id}
                    fontSize={{ sm: '14px' }}
                    minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                    borderColor="transparent"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Modal for Create Event */}
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex justifyContent="center" alignItems="center" mb="4">
              {/* Step Indicator */}
              <Flex alignItems="center" direction="row" w="100%">
                {/* Step 1 */}
                <Flex direction="column" alignItems="center" mx="2">
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="50%"
                    bg={currentStep >= 1 ? 'blue.500' : 'gray.300'}
                    mb="2"
                  />
                  <Text fontSize="sm" color={currentStep >= 1 ? 'blue.500' : 'gray.500'}>
                    Create Event
                  </Text>
                </Flex>
                <Box 
                  h="2px"
                  flex="1"
                  bg={currentStep >= 2 ? 'blue.500' : 'gray.300'}
                  alignSelf="center"
                />
                {/* Step 2 */}
                <Flex direction="column" alignItems="center" mx="2">
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="50%"
                    bg={currentStep >= 2 ? 'blue.500' : 'gray.300'}
                    mb="2"
                  />
                  <Text fontSize="sm" color={currentStep >= 2 ? 'blue.500' : 'gray.500'}>
                    Choose Attributes
                  </Text>
                </Flex>
                <Box
                  h="2px"
                  flex="1"
                  bg={currentStep === 3 ? 'blue.500' : 'gray.300'}
                  alignSelf="center"
                />
                {/* Step 3 */}
                <Flex direction="column" alignItems="center" mx="2">
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="50%"
                    bg={currentStep === 3 ? 'blue.500' : 'gray.300'}
                    mb="2"
                  />
                  <Text fontSize="sm" color={currentStep === 3 ? 'blue.500' : 'gray.500'}>
                    Submit Event
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </ModalHeader>
          <ModalCloseButton onClick={handleClose} />
          <ModalBody>
            {currentStep === 1 ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                setCurrentStep(2);
              }}>
                <FormControl mb="4">
                  <FormLabel>Event Name</FormLabel>
                  <Input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder="Enter event name"
                    required
                  />
                </FormControl>
                <FormControl mb="4">
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="datetime-local"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleInputChange}
                    required
                  />
                </FormControl>
                <FormControl mb="4">
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="datetime-local"
                    name="dateFin"
                    value={formData.dateFin}
                    onChange={handleInputChange}
                    required
                  />
                </FormControl>
                <FormControl mb="4">
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter event description"
                    required
                  />
                </FormControl>
                <FormControl mb="4">
                  <FormLabel>Image URL</FormLabel>
                  <Input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="Enter image URL"
                    required
                  />
                </FormControl>
                {/* Pricing Steps Per Specialty */}
                <FormControl mb="4">
                  <FormLabel>Event Pricing Steps by Specialty</FormLabel>
                  {Object.entries(formData.pricingBySpecialty).map(([specialty, steps]) => (
                    <Box key={specialty} mb="2" border="1px solid #ccc" p="2" borderRadius="md">
                      <Flex align="center" mb="2">
                        <Text fontWeight="bold">{specialty}</Text>
                        <Button size="xs" colorScheme="red" ml="2"
                          onClick={() => removeSpecialty(specialty)}>
                          Remove Specialty
                        </Button>
                      </Flex>
                      {steps.map((step, idx) => (
                        <Flex key={idx} mb="2" gap="2">
                          <Input
                            type="number"
                            placeholder="Price"
                            value={step.price}
                            min="0"
                            step="0.01"
                            onChange={e => handlePricingStepChange(specialty, idx, 'price', e.target.value)}
                            required
                          />
                          <Input
                            type="datetime-local"
                            placeholder="Deadline"
                            value={step.deadline}
                            onChange={e => handlePricingStepChange(specialty, idx, 'deadline', e.target.value)}
                          />
                          <Button size="xs" colorScheme="red"
                            onClick={() => removePricingStep(specialty, idx)}>
                            Remove Step
                          </Button>
                        </Flex>
                      ))}
                      <Button size="xs" colorScheme="blue"
                        onClick={() => addPricingStep(specialty)}>
                        Add Step
                      </Button>
                    </Box>
                  ))}
                  <Flex mt="2">
                    <Input
                      placeholder="Specialty name"
                      value={formData.newSpecialty}
                      onChange={handleSpecialtyChange}
                    />
                    <Button ml="2" size="sm" colorScheme="green"
                      onClick={addSpecialty}>
                      Add Specialty
                    </Button>
                  </Flex>
                </FormControl>
                <FormControl mb="4">
                  <FormLabel>Workshops</FormLabel>
                  {formData.workshops.map((workshop, index) => (
                    <Box key={index} mb="4" border="1px solid #ccc" p="4" borderRadius="md">
                      <FormControl mb="2">
                        <FormLabel>Workshop Name</FormLabel>
                        <Input
                          type="text"
                          value={workshop.nom}
                          onChange={(e) => handleWorkshopChange(index, 'nom', e.target.value)}
                          placeholder="Enter workshop name"
                          required
                        />
                      </FormControl>
                      <FormControl mb="2">
                        <FormLabel>Workshop Description</FormLabel>
                        <Textarea
                          value={workshop.description}
                          onChange={(e) => handleWorkshopChange(index, 'description', e.target.value)}
                          placeholder="Enter workshop description"
                          required
                        />
                      </FormControl>
                      <FormControl mb="2">
                        <FormLabel>Workshop Capacity</FormLabel>
                        <Input
                          type="number"
                          value={workshop.capacity}
                          onChange={(e) => handleWorkshopChange(index, 'capacity', e.target.value)}
                          placeholder="Enter workshop capacity"
                          required
                        />
                      </FormControl>
                      <FormControl mb="2">
                        <FormLabel>Workshop Price</FormLabel>
                        <Input
                          type="number"
                          value={workshop.price || ''}
                          onChange={(e) => handleWorkshopChange(index, 'price', e.target.value)}
                          placeholder="Enter workshop price"
                          min="0"
                          step="0.01"
                          required
                        />
                      </FormControl>
                      <Button colorScheme="red" size="sm" onClick={() => removeWorkshop(index)}>
                        Remove Workshop
                      </Button>
                    </Box>
                  ))}
                  <Button colorScheme="blue" size="sm" onClick={addWorkshop}>
                    Add Workshop
                  </Button>
                </FormControl>
                <Button type="submit" colorScheme="blue" w="100%">
                  Next
                </Button>
              </form>
            ) : currentStep === 2 ? (
              // Step 2: Attribute Selection Form
              <Box>
                <Text mb="4">Select attributes to include in the subscription form:</Text>
                <FormControl>
                  <CheckboxGroup
                    value={selectedAttributes}
                    onChange={setSelectedAttributes}
                  >
                    <Stack spacing={3}>
                      <Checkbox value="activity">Activity</Checkbox>
                      <Checkbox value="professionType">Doctor/Paramedical</Checkbox>
                      <Checkbox value="etablissement">Etablissement</Checkbox>
                      <Checkbox value="city">City</Checkbox>
                      <Checkbox value="societyName">Name of Society</Checkbox>
                      <Checkbox value="name">Name</Checkbox>
                      <Checkbox value="email">Email</Checkbox>
                      <Checkbox value="phone">Phone</Checkbox>
                      <Checkbox value="address">Address</Checkbox>
                      <Checkbox value="country">Country</Checkbox>
                      <Checkbox value="specialty">Specialty</Checkbox>
                      <Checkbox value="price">Price</Checkbox>
                      <Checkbox value="takeover">Takeover </Checkbox>
                      <Checkbox value="laboratoryName">Laboratory Name</Checkbox>
                    </Stack>
                  </CheckboxGroup>
                </FormControl>
                {/* Show Activity Options only if "activity" is selected */}
                {selectedAttributes.includes("activity") && (
                  <FormControl mt="4" mb="4">
                    <FormLabel>Activity Options (dropdown choices)</FormLabel>
                    <CheckboxGroup
                      colorScheme="blue"
                      value={formData.activityOptions}
                      onChange={handleActivityOptionsChange}
                    >
                      <Stack direction="row">
                        <Checkbox value="public">Public</Checkbox>
                        <Checkbox value="private">Private</Checkbox>
                        <Checkbox value="sponsor">Sponsor</Checkbox>
                      </Stack>
                    </CheckboxGroup>
                  </FormControl>
                )}
                {/* For each selected attribute (except itself), allow setting a condition */}
                {selectedAttributes.filter(attr => attr !== "activity").map(attr => (
                  <Box key={attr} mt="2" p="2" border="1px solid #eee" borderRadius="md">
                    <Text fontSize="sm" mb="1" fontWeight="bold">{ATTRIBUTE_META[attr]?.label || attr}</Text>
                    <FormLabel fontSize="sm">Show only if</FormLabel>
                    <select
                      value={attributeConditions[attr]?.attribute || ""}
                      onChange={e => handleConditionChange(attr, "attribute", e.target.value)}
                    >
                      <option value="">Always show</option>
                      {selectedAttributes
                        .filter(a => a !== attr) 
                        .map(a => (
                          <option key={a} value={a}>
                            {ATTRIBUTE_META?.[a]?.label || a}
                          </option>
                        ))}
                    </select>
                    {attributeConditions[attr]?.attribute && (
                      <select
                        value={attributeConditions[attr]?.value || ""}
                        onChange={e => handleConditionChange(attr, "value", e.target.value)}
                      >
                        <option value="">Choose value</option>
                        {/* Show options based on the selected attribute */}
                        {attributeConditions[attr]?.attribute === "activity" &&
                          formData.activityOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))
                        }
                        {attributeConditions[attr]?.attribute === "takeover" && (
                          <>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </>
                        )}
                        {/* Add more attribute-specific options here if needed */}
                      </select>
                    )}
                  </Box>
                ))}
                <Button
                  mt="4"
                  colorScheme="blue"
                  w="100%"
                  onClick={() => setCurrentStep(3)}
                >
                  Next
                </Button>
              </Box>
            ) : (
              // Step 3: Finished Step
              <Box textAlign="center">
                <Text fontSize="lg" fontWeight="bold" mb="4">
                  Finished!
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    handleSubmit();
                  }}
                >
                  Submit
                </Button>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}