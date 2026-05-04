import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import DataTable from "react-data-table-component";
import { FaFilePdf, FaFileExcel, FaSearch, FaFileContract, FaSync, FaFilter } from "react-icons/fa";
import PropTypes from "prop-types";
import { styled, keyframes } from "@mui/system";
import { customTableStyles } from "./Styles.datatables";
import { useTheme } from '@mui/material/styles';
// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

// Styled Components
const TableContainer = styled(Paper)(() => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
  animation: `${fadeIn} 0.6s ease-out`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #2e327d 0%, #4c6baf 50%, #2e507d 100%)',
    backgroundSize: '200% 100%',
    animation: `${shimmer} 3s linear infinite`,
  },
}));

const TableHeader = styled(Box)(() => ({
  padding: '24px 24px 16px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.03) 0%, rgba(76, 175, 80, 0.02) 100%)',
}));

const TableTitle = styled(Typography)(() => ({
  fontSize: '20px',
  fontWeight: 700,
  color: '#1e293b',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}));

const TableSubHeader = styled(Stack)(() => ({
  padding: '20px 24px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  background: 'rgba(248, 250, 252, 0.5)',
}));

const SearchField = styled(TextField)(() => ({
  flex: 1,
  minWidth: '250px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(148, 163, 184, 0.2)',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: '#2E7D32',
      borderWidth: '1px',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2E7D32',
      borderWidth: '2px',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px 16px',
    fontSize: '14px',
  },
}));

const FilterSelect = styled(FormControl)(() => ({
  minWidth: '180px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(148, 163, 184, 0.2)',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: '#2e437d',
      borderWidth: '1px',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2e3c7d',
      borderWidth: '2px',
    },
  },
  '& .MuiSelect-select': {
    padding: '12px 16px',
    fontSize: '14px',
  },
  '& .MuiInputLabel-root': {
    fontSize: '14px',
    '&.Mui-focused': {
      color: '#2e407d',
    },
  },
}));

const ActionButton = styled(IconButton)(({ color = 'default' }) => {
  const colorMap = {
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      hover: 'rgba(239, 68, 68, 0.2)',
      color: '#ef4444',
      shadow: 'rgba(239, 68, 68, 0.3)',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      hover: 'rgba(16, 185, 129, 0.2)',
      color: '#10b981',
      shadow: 'rgba(16, 185, 129, 0.3)',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      hover: 'rgba(59, 130, 246, 0.2)',
      color: '#3b82f6',
      shadow: 'rgba(59, 130, 246, 0.3)',
    },
    secondary: {
      bg: 'rgba(100, 116, 139, 0.1)',
      hover: 'rgba(100, 116, 139, 0.2)',
      color: '#64748b',
      shadow: 'rgba(100, 116, 139, 0.3)',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      hover: 'rgba(245, 158, 11, 0.2)',
      color: '#f59e0b',
      shadow: 'rgba(245, 158, 11, 0.3)',
    },
  };

  const colors = colorMap[color] || colorMap.secondary;

  return {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.color}20`,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: colors.hover,
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 12px ${colors.shadow}`,
    },
  };
});

// Skeleton Loading Component
const TableSkeleton = ({ rows = 10 }) => (
  <Box sx={{ p: 3 }}>
    {/* Header Skeleton */}
    <Stack spacing={2} mb={3}>
      <Skeleton variant="text" width="30%" height={32} />
      <Skeleton variant="text" width="15%" height={20} />
    </Stack>

    {/* Action Bar Skeleton */}
    <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
      <Stack direction="row" spacing={1}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </Stack>
      <Skeleton variant="rounded" height={44} sx={{ minWidth: 250, borderRadius: '12px' }} />
    </Stack>

    {/* Filter Bar Skeleton */}
    <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
      <Skeleton variant="rounded" width={180} height={56} sx={{ borderRadius: '12px' }} />
      <Skeleton variant="rounded" width={180} height={56} sx={{ borderRadius: '12px' }} />
      <Skeleton variant="rounded" width={180} height={56} sx={{ borderRadius: '12px' }} />
    </Stack>

    {/* Table Rows Skeleton */}
    <Stack spacing={1.5}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            p: 2,
            borderRadius: '8px',
            backgroundColor: index % 2 === 0 ? 'rgba(248, 250, 252, 0.5)' : 'transparent',
          }}
        >
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="25%" height={24} />
          <Skeleton variant="text" width="20%" height={24} />
          <Skeleton variant="text" width="15%" height={24} />
          <Skeleton variant="text" width="15%" height={24} />
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Stack>
        </Box>
      ))}
    </Stack>
  </Box>
);

const Datatable = ({
  title,
  columns,
  data,
  onExportPDF,
  onExportExcel,
  onContactExport,
  onRefresh,
  actions,
  onChange,
  value,
  isHeadButton = false,
  isContact = false,
  progressPending = false,
  isLoading = false,
  noDataComponent,
  filters = [],
  filterValues = {},
  onFilterChange,
  showFilterCount = true,
}) => {
  // Count active filters
  const activeFilterCount = Object.values(filterValues).filter(val => val && val !== '').length;
  const theme = useTheme();
  // Show skeleton when isLoading is true
  if (isLoading) {
    return (
      <TableContainer>
        <TableSkeleton rows={10} />
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      {/* Header */}
      {title && (
        <TableHeader>
          <TableTitle variant="h6">
            {title}
            {showFilterCount && activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} filtre${activeFilterCount > 1 ? 's' : ''} actif${activeFilterCount > 1 ? 's' : ''}`}
                size="small"
                color="primary"
                sx={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              />
            )}
          </TableTitle>
          <Typography variant="body2" color="text.secondary">
            {data?.length || 0} enregistrement(s) au total
          </Typography>
        </TableHeader>
      )}

      {/* Sub Header with Actions */}
      <TableSubHeader direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          {onRefresh && (
            <Tooltip title="Actualiser les données" arrow>
              <ActionButton color="secondary" onClick={onRefresh} aria-label="refresh">
                <FaSync size={18} />
              </ActionButton>
            </Tooltip>
          )}

          {isHeadButton && (
            <>
              {isContact && onContactExport && (
                <Tooltip title="Exporter la liste des contacts" arrow>
                  <ActionButton
                    color="info"
                    onClick={onContactExport}
                    aria-label="Export Contact List"
                  >
                    <FaFileContract size={18} />
                  </ActionButton>
                </Tooltip>
              )}

              {onExportPDF && (
                <Tooltip title="Exporter en PDF" arrow>
                  <ActionButton
                    color="error"
                    onClick={onExportPDF}
                    aria-label="Export PDF"
                  >
                    <FaFilePdf size={18} />
                  </ActionButton>
                </Tooltip>
              )}

              {onExportExcel && (
                <Tooltip title="Exporter en Excel" arrow>
                  <ActionButton
                    color="success"
                    onClick={onExportExcel}
                    aria-label="Export Excel"
                  >
                    <FaFileExcel size={18} />
                  </ActionButton>
                </Tooltip>
              )}
            </>
          )}
        </Stack>

        {/* Search Field */}
        <SearchField
          placeholder="Rechercher..."
          variant="outlined"
          size="small"
          value={value || ''}
          onChange={onChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch style={{ color: '#64748b', fontSize: '16px' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </TableSubHeader>

      {/* Filters Section */}
      {filters && filters.length > 0 && (
        <Box
          sx={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            background: 'rgba(248, 250, 252, 0.3)',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
              <FaFilter size={16} />
              <Typography variant="body2" fontWeight={600}>
                Filtres:
              </Typography>
            </Box>

            {filters.map((filter) => (
              <FilterSelect key={filter.name} size="small">
                <InputLabel id={`filter-${filter.name}-label`}>{filter.label}</InputLabel>
                <Select
                  labelId={`filter-${filter.name}-label`}
                  id={`filter-${filter.name}`}
                  value={filterValues[filter.name] || ''}
                  label={filter.label}
                  onChange={(e) => onFilterChange?.(filter.name, e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tous</em>
                  </MenuItem>
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FilterSelect>
            ))}

            {activeFilterCount > 0 && (
              <Tooltip title="Réinitialiser tous les filtres" arrow>
                <ActionButton
                  color="warning"
                  size="small"
                  onClick={() => {
                    filters.forEach(filter => onFilterChange?.(filter.name, ''));
                  }}
                  aria-label="clear filters"
                >
                  <FaSync size={16} />
                </ActionButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}

      {/* DataTable */}
      <Box sx={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns(actions || {})}
          data={data}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
          fixedHeader
          fixedHeaderScrollHeight="500px"
          customStyles={customTableStyles(theme)}
          progressPending={progressPending}
          noDataComponent={
            noDataComponent || (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  color: 'text.secondary',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Aucune donnée disponible
                </Typography>
                <Typography variant="body2">
                  {activeFilterCount > 0
                    ? 'Aucun enregistrement trouvé avec les filtres appliqués'
                    : 'Aucun enregistrement trouvé pour le moment'}
                </Typography>
              </Box>
            )
          }
          highlightOnHover
          pointerOnHover
          responsive
          dense
        />
      </Box>
    </TableContainer>
  );
};

Datatable.propTypes = {
  title: PropTypes.string,
  columns: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  isHeadButton: PropTypes.bool,
  isContact: PropTypes.bool,
  progressPending: PropTypes.bool,
  isLoading: PropTypes.bool,
  showFilterCount: PropTypes.bool,
  actions: PropTypes.shape({
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onAdd: PropTypes.func,
    onView: PropTypes.func,
    onActive: PropTypes.func,
    onBestSeller: PropTypes.func,
    onAddMeasure: PropTypes.func,
    onAddImages: PropTypes.func,
  }),
  onChange: PropTypes.func,
  onExportExcel: PropTypes.func,
  onExportPDF: PropTypes.func,
  onRefresh: PropTypes.func,
  onContactExport: PropTypes.func,
  value: PropTypes.string,
  noDataComponent: PropTypes.node,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ),
  filterValues: PropTypes.object,
  onFilterChange: PropTypes.func,
};

export default Datatable;