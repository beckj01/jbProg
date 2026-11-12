import {useState, useEffect} from 'react'
import {qtyAPI} from '../services/api'

export default function QtyView() {
    const [quantities, setQuantities] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        qtyAPI.getAll()
            .then(data => {
                setQuantities(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            })
    }, [])

    if (loading) return <div className="text-center py-20 text-gray-400">Loading Quantitites...</div>
    if (error) return <div className="text-center py-20 text-red-400">Error: {error}</div>


    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100 tracking-wide">Quantities Register</h2>
                <span className="text-sm text-gray-400">{quantities.length} total items</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-950">
                        <tr>
                            <th className="px-6 py-2 text-left text-xs font-semibold, text-gray-400 tracking-wider">Name</th>
                            <th className="px-6 py-2 text-left text-xs font-semibold, text-gray-400 tracking-wider">UoM</th>
                            <th className="px-6 py-2 text-left text-xs font-semibold, text-gray-400 tracking-wider">Area</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 bg-gray-900">
                        {quantities.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No quantities found</td>
                            </tr>
                            ) : (
                              quantities.map(q => (
                                <tr key={q.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-200">{q.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{q.UoM}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{q.area || ""}</td>
                                </tr>
                              ))  
                            )}
                    </tbody>
                </table>
            </div>
        </div>



    )


}
