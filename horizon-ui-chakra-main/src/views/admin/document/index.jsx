import React from "react";
import { useEffect, useState } from "react";

// Chakra imports
import {
  Box,
  Text,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Flex
} from "@chakra-ui/react";
import { FaFileAlt, FaCheckCircle, FaClock, FaUsers } from "react-icons/fa";

import Documents from "views/admin/document/components/documents";

export default function Marketplace() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const [communications, setCommunications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetch("http://localhost:5000/communications")
      .then((res) => res.json())
      .then((data) => {
        setCommunications(data);

        // Calculate stats
        let total = data.length;
        let approved = 0, pending = 0, rejected = 0;
        data.forEach(comm => {
          const scores = comm.scores || [];
          const members = comm.committeeMembers || [];
          // If not all reviewers have set a score, it's pending
          if (!scores.length || scores.length < members.length || scores.some(s => s === null || s === undefined)) {
            pending++;
          } else {
            let avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            avg = Math.min(avg, 10);
            if (avg >= 8) approved++;
            else if (avg >= 5) pending++;
            else rejected++;
          }
        });
        setStats({ total, approved, pending, rejected });
      })
      .catch((err) => console.error("Error fetching communications:", err));
  }, []);

  const statItems = [
    { label: "Total Communications", value: stats.total, icon: FaFileAlt },
    { label: "Pending Review", value: stats.pending, icon: FaClock },
    { label: "Approved", value: stats.approved, icon: FaCheckCircle },
    { label: "Rejected", value: stats.rejected, icon: FaUsers },
  ];

  return (
    <Box pt={{ base: "80px", md: "80px", xl: "80px" }}>

      {/* Color Code Documentation */}
      <Box
        mb={6}
        p={4}
        bg="gray.50"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <Text fontWeight="bold" mb={2}>Status Color Codes:</Text>
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box w="16px" h="16px" bg="green.200" borderRadius="md" border="1px solid" borderColor="gray.300" />
            <Text fontSize="sm">Approved (Average score ≥ 8)</Text>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box w="16px" h="16px" bg="orange.200" borderRadius="md" border="1px solid" borderColor="gray.300" />
            <Text fontSize="sm">Pending (Not all reviewers have scored, or average score between 5 and 8)</Text>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box w="16px" h="16px" bg="red.200" borderRadius="md" border="1px solid" borderColor="gray.300" />
            <Text fontSize="sm">Rejected (All reviewers scored and average score &lt; 5)</Text>
          </Box>
        </Box>
      </Box>
      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={8}>
        {statItems.map((stat, index) => (
          <Stat key={index} p={4} bg="white" borderRadius="md" boxShadow="sm">
            <Flex justifyContent="space-between" alignItems="center">
              <Box>
                <StatLabel color="gray.500">{stat.label}</StatLabel>
                <StatNumber color={textColor}>{stat.value}</StatNumber>
              </Box>
              <Box as={stat.icon} size="24px" color="blue.500" />
            </Flex>
          </Stat>
        ))}
      </SimpleGrid>

      <Documents tableData={communications} />
    </Box>
  );
}