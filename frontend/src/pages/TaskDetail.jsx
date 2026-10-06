import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTask } from '../services/taskService';

const TaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const data = await getTask(id);
                setTask(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error}</div>;
    if (!task) return <div>Tâche introuvable</div>;

    return (
        <div>
            <Link to="/">&larr; Retour à la liste</Link>
            
            <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h2>{task.title}</h2>
                <span style={{ 
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    backgroundColor: task.completed ? '#4CAF50' : '#ff9800',
                    color: 'white',
                    marginBottom: '15px'
                }}>
                    {task.completed ? 'Terminée' : 'À faire'}
                </span>
                
                <p><strong>Description :</strong><br/> {task.description || 'Aucune description'}</p>
                <p><strong>Assigné à :</strong> {task.assigneeName || 'Non assigné'}</p>
            </div>
        </div>
    );
};

export default TaskDetail;
