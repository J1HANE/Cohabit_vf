import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, deleteTask, updateTask } from '../services/taskService';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const data = await getTasks();
            setTasks(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
            try {
                await deleteTask(id);
                setTasks(tasks.filter(task => task.id !== id));
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            const updatedTask = { ...task, completed: !task.completed };
            const returnedTask = await updateTask(task.id, updatedTask);
            setTasks(tasks.map(t => t.id === task.id ? returnedTask : t));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur : {error}</div>;

    return (
        <div>
            <h2>Liste des tâches</h2>
            <Link to="/tasks/new">
                <button style={{ marginBottom: '20px' }}>Ajouter une tâche</button>
            </Link>
            
            {tasks.length === 0 ? (
                <p>Aucune tâche pour le moment.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {tasks.map(task => (
                        <li key={task.id} style={{ 
                            border: '1px solid #ccc', 
                            padding: '10px', 
                            marginBottom: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: task.completed ? '#e0ffe0' : 'white'
                        }}>
                            <div>
                                <h3 style={{ textDecoration: task.completed ? 'line-through' : 'none', margin: '0 0 5px 0' }}>
                                    <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                                    Assigné à : {task.assigneeName || 'Non assigné'}
                                </p>
                            </div>
                            <div>
                                <button onClick={() => handleToggleComplete(task)} style={{ marginRight: '10px' }}>
                                    {task.completed ? 'Marquer à faire' : 'Marquer terminé'}
                                </button>
                                <button onClick={() => handleDelete(task.id)} style={{ backgroundColor: '#ff4444', color: 'white', border: 'none' }}>
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TaskList;
