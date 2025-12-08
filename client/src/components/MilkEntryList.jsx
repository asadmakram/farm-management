import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaTrash, FaEye } from 'react-icons/fa';
import { useMilkStore } from '../../store/milkStore';

const MilkEntryList = ({ farmId, date = null, animalId = null, startDate = null, endDate = null }) => {
  const { entries, loading, error, listByDate, listByAnimalRange, deleteEntry } = useMilkStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (animalId && startDate && endDate) {
      listByAnimalRange(farmId, animalId, startDate, endDate);
    } else if (date) {
      listByDate(farmId, date);
    }
  }, [farmId, date, animalId, startDate, endDate]);

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteEntry(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error && entries.length === 0) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (entries.length === 0) {
    return (
      <Alert variant="info">
        No milk entries found for the selected period.
      </Alert>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <Card.Title className="mb-0">Milk Production Records ({entries.length})</Card.Title>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Animal</th>
                  <th>Morning</th>
                  <th>Evening</th>
                  <th>Total Liters</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <Badge bg="secondary">{entry.date}</Badge>
                    </td>
                    <td>{entry.animalId?.name || entry.animalId}</td>
                    <td>
                      {entry.sessions.morning ? (
                        <span className="text-success">
                          {entry.sessions.morning.liters}L
                          {entry.sessions.morning.fat && ` (${entry.sessions.morning.fat}%)`}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {entry.sessions.evening ? (
                        <span className="text-info">
                          {entry.sessions.evening.liters}L
                          {entry.sessions.evening.fat && ` (${entry.sessions.evening.fat}%)`}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <strong className="text-primary">{entry.totalLiters}L</strong>
                    </td>
                    <td className="text-end">
                      <Button 
                        variant="sm" 
                        size="sm"
                        className="me-2"
                        title="View details"
                      >
                        <FaEye />
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteClick(entry._id)}
                        title="Delete entry"
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this milk entry? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? <Spinner size="sm" className="me-2" /> : null}
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MilkEntryList;
