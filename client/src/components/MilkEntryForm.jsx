import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useMilkStore } from '../../store/milkStore';

const MilkEntryForm = ({ farmId, animalId, initialDate = null, onSuccess = null }) => {
  const { upsertEntry, loading, error } = useMilkStore();
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [morningLiters, setMorningLiters] = useState('');
  const [morningFat, setMorningFat] = useState('');
  const [morningSnf, setMorningSnf] = useState('');
  const [eveningLiters, setEveningLiters] = useState('');
  const [eveningFat, setEveningFat] = useState('');
  const [eveningSnf, setEveningSnf] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    const sessions = {};
    if (morningLiters) {
      sessions.morning = { liters: parseFloat(morningLiters) };
      if (morningFat) sessions.morning.fat = parseFloat(morningFat);
      if (morningSnf) sessions.morning.snf = parseFloat(morningSnf);
    }
    if (eveningLiters) {
      sessions.evening = { liters: parseFloat(eveningLiters) };
      if (eveningFat) sessions.evening.fat = parseFloat(eveningFat);
      if (eveningSnf) sessions.evening.snf = parseFloat(eveningSnf);
    }

    if (Object.keys(sessions).length === 0) {
      setLocalError('Please enter at least one session (morning or evening)');
      return;
    }

    try {
      await upsertEntry({
        farmId,
        animalId,
        date,
        sessions,
        notes: notes || undefined
      });
      
      setMorningLiters('');
      setMorningFat('');
      setMorningSnf('');
      setEveningLiters('');
      setEveningFat('');
      setEveningSnf('');
      setNotes('');
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Failed to save entry');
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <Card.Title className="mb-0">Record Milk Production</Card.Title>
      </Card.Header>
      <Card.Body>
        {(error || localError) && (
          <Alert variant="danger" onClose={() => setLocalError(null)} dismissible>
            {error || localError}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <h5 className="mb-3 text-secondary">Morning Session</h5>
              <Form.Group className="mb-2">
                <Form.Label>Liters</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={morningLiters}
                  onChange={(e) => setMorningLiters(e.target.value)}
                  placeholder="0.00"
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Fat %</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={morningFat}
                  onChange={(e) => setMorningFat(e.target.value)}
                  placeholder="0.00"
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>SNF %</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={morningSnf}
                  onChange={(e) => setMorningSnf(e.target.value)}
                  placeholder="0.00"
                />
              </Form.Group>
            </div>

            <div className="col-md-6">
              <h5 className="mb-3 text-secondary">Evening Session</h5>
              <Form.Group className="mb-2">
                <Form.Label>Liters</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={eveningLiters}
                  onChange={(e) => setEveningLiters(e.target.value)}
                  placeholder="0.00"
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Fat %</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={eveningFat}
                  onChange={(e) => setEveningFat(e.target.value)}
                  placeholder="0.00"
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>SNF %</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={eveningSnf}
                  onChange={(e) => setEveningSnf(e.target.value)}
                  placeholder="0.00"
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about today's production..."
            />
          </Form.Group>

          <Button 
            variant="success" 
            type="submit" 
            disabled={loading}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" /> Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default MilkEntryForm;
