import React, { useState } from 'react';
import './UniProtSearch.css';

function UniProtSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [proteinData, setProteinData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // UniProt accession number pattern (e.g., P12345 or A0A0A0A0A0)
    const uniprotPattern = /^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/;

    const convertToCSV = (data) => {
        // Helper function to safely convert values to strings
        const safeString = (value) => {
            if (Array.isArray(value)) return value.join('; ');
            if (typeof value === 'object' && value !== null) return JSON.stringify(value);
            return value || '';
        };

        // Helper function to get alternative names
        const getAlternativeNames = (data) => {
            const geneSynonyms = data.genes[0].synonyms.map(syn => syn.value).join(', ');
            const proteinAltNames = data.proteinDescription.alternativeNames.map(alt => alt.fullName.value).join(', ');
            const proteinShortNames = data.proteinDescription.recommendedName.shortNames.map(short => short.value).join(', ');
            
            return [geneSynonyms, proteinAltNames, proteinShortNames]
                .filter(Boolean)
                .join(', ');
        };

        // Get extracellular features and their sequences
        const extracellularFeatures = data.features
            .filter(feature => 
                feature.description && 
                feature.description.toLowerCase().includes('extracellular') &&
                feature.location
            )
            .map(feature => {
                const start = feature.location.start.value;
                const end = feature.location.end.value;
                const firstAA = data.sequence.value[start - 1];
                const lastAA = data.sequence.value[end - 1];
                const sequenceSegment = data.sequence.value.substring(start - 1, end);
                return {
                    range: `${firstAA}${start}-${lastAA}${end}`,
                    sequence: sequenceSegment
                };
            });

        // Create CSV rows
        const rows = extracellularFeatures.map(feature => {
            const fields = [
                { key: 'sequenceName', value: data.proteinDescription.recommendedName.fullName.value },
                { key: 'uniprotNumber', value: data.primaryAccession },
                { key: 'geneName', value: data.genes[0].geneName.value },
                { key: 'species', value: data.organism.commonName },
                { key: 'alternativeNames', value: getAlternativeNames(data) },
                { key: 'sourceRange', value: feature.range },
                { key: 'sourceSequence', value: feature.sequence }
            ];

            return fields.map(field => {
                const value = safeString(field.value);
                return `"${value.replace(/"/g, '""')}"`;
            }).join(',');
        });

        // Define headers
        const headers = [
            'Sequence Name',
            'UniProt #',
            'Gene Name',
            'Species',
            'Alternative Names',
            'Source Range',
            'Source Sequence'
        ].join(',');

        return `${headers}\n${rows.join('\n')}`;
    };

    const handleDownload = () => {
        if (!proteinData) return;

        const csv = convertToCSV(proteinData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${proteinData.primaryAccession}_protein_data.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setError('Please enter a UniProt accession number');
            return;
        }

        if (!uniprotPattern.test(searchTerm.trim())) {
            setError('Please enter a valid UniProt accession number (e.g., P12345 or A0A0A0A0A0)');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(searchTerm.trim())}.json`
            );

            if (!response.ok) {
                throw new Error('Protein not found');
            }

            const data = await response.json();
            console.log(data);
            setProteinData(data);
        } catch (err) {
            setError('Protein not found. Please check the accession number and try again.');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderProteinDetails = (data) => {
        // Helper function to safely render nested objects
        const renderValue = (value) => {
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
            }
            return value || 'Not available';
        };

        const alternateNames = (arr) => {
            if (arr.length === 0) return 'Not available';
            if (arr[0].fullName !== undefined) {
                return arr.map(item => item.fullName.value).join(', ');
            } else {
                return arr.map(item => item.value).join(', ');
            }
        };

        return (
            <div className="protein-details">
                <div className="protein-header">
                    <h2>{renderValue(data.primaryAccession)}</h2>
                    <p className="accession">{renderValue(data.uniProtkbId)}</p>
                </div>

                <div className="protein-sections">
                    <section className="protein-section">
                        <h3>Gene Names</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <strong>Gene Name:</strong>
                                <p>{renderValue(data.genes[0].geneName.value)}</p>
                            </div>
                            <div className="info-item">
                                <strong>Alternative Names:</strong>
                                <p>{renderValue(alternateNames(data.genes[0].synonyms))}</p>
                            </div>
                        </div>
                    </section>

                    <section className="protein-section">
                        <h3>Protein Names</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <strong>Full Name:</strong>
                                <p>{renderValue(data.proteinDescription.recommendedName.fullName.value)}</p>
                            </div>
                            <div className="info-item">
                                <strong>Alternative Names:</strong>
                                <p>{renderValue(alternateNames(data.proteinDescription.alternativeNames))}</p>
                            </div>
                            <div className="info-item">
                                <strong>Short Names:</strong>
                                <p>{renderValue(alternateNames(data.proteinDescription.recommendedName.shortNames))}</p>
                            </div>
                        </div>
                    </section>

                    <section className="protein-section">
                        <h3>Species</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <strong>Common Name:</strong>
                                <p>{renderValue(data.organism.commonName)}</p>
                            </div>
                            <div className="info-item">
                                <strong>Scientific Name:</strong>
                                <p>{renderValue(data.organism.scientificName)}</p>
                            </div>
                        </div>
                    </section>

                    {data.features && data.features.length > 0 && (
                        <section className="protein-section">
                            <h3>Extracellular Features</h3>
                            <div className="features-list">
                                {data.features
                                    .filter(feature => 
                                        feature.description && 
                                        feature.description.toLowerCase().includes('extracellular')
                                    )
                                    .map((feature, index) => (
                                        <div key={index} className="feature-item">
                                            <span className="feature-type">{renderValue(feature.type)}</span>
                                            <span className="feature-location">
                                                {feature.location ? 
                                                    `${renderValue(feature.location.start.value)} - ${renderValue(feature.location.end.value)}` 
                                                    : 'Location not available'}
                                            </span>
                                            <span className="feature-description">{renderValue(feature.description)}</span>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    )}

                    {data.sequence && (
                        <section className="protein-section">
                            <h3>Extracellular Sequence Regions</h3>
                            <div className="sequence-container">
                                {data.features
                                    .filter(feature => 
                                        feature.description && 
                                        feature.description.toLowerCase().includes('extracellular') &&
                                        feature.location
                                    )
                                    .map((feature, index) => {
                                        const start = feature.location.start.value;
                                        const end = feature.location.end.value;
                                        const sequenceSegment = data.sequence.value.substring(start - 1, end);
                                        const firstAA = data.sequence.value[start - 1];
                                        const lastAA = data.sequence.value[end - 1];
                                        return (
                                            <div key={index} className="sequence-segment">
                                                <div className="sequence-header">
                                                    <span className="sequence-location">
                                                        Region {index + 1}: {firstAA}{start} - {lastAA}{end}
                                                    </span>
                                                    <span className="sequence-type">{feature.type}</span>
                                                </div>
                                                <pre className="sequence">{sequenceSegment}</pre>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="uniprot-search">
            <div className="search-header">
                <h2>UniProt Protein Search</h2>
                <p>Enter a UniProt accession number to view protein details</p>
            </div>

            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-container">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Enter UniProt accession number (e.g., P12345)"
                        className="search-input"
                    />
                    <button type="submit" className="search-button" disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && <div className="error-message">{error}</div>}

            {isLoading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Fetching protein details...</p>
                </div>
            )}

            {proteinData && (
                <>
                    {renderProteinDetails(proteinData)}
                    <div className="download-section">
                        <button onClick={handleDownload} className="download-button">
                            Download as CSV
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default UniProtSearch; 