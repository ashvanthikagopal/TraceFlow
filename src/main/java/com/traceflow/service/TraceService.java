package com.traceflow.service;

import com.traceflow.model.Analysis;
import com.traceflow.model.TraceEvent;
import com.traceflow.model.VariableState;
import com.traceflow.repository.TraceRepository;
import com.traceflow.repository.VariableStateRepository;
import com.traceflow.source.dto.TraceResponse;
import com.traceflow.source.dto.VariableTimelineResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TraceService {

    private final TraceRepository traceRepository;
    private final VariableStateRepository variableStateRepository;

    public TraceService(TraceRepository traceRepository, VariableStateRepository variableStateRepository) {
        this.traceRepository = traceRepository;
        this.variableStateRepository = variableStateRepository;
    }

    @Transactional
    public TraceResponse saveAndProcessTrace(Analysis analysis, List<DebugService.RawTraceStep> rawSteps) {
        // Clean previous trace if any
        traceRepository.deleteByAnalysisId(analysis.getId());

        List<TraceResponse.StepDto> stepDtos = new ArrayList<>();
        Map<String, String> lastKnownValues = new HashMap<>();

        for (DebugService.RawTraceStep raw : rawSteps) {
            TraceEvent event = new TraceEvent(
                    analysis,
                    raw.getStepNo(),
                    raw.getEventType(),
                    raw.getClassName(),
                    raw.getMethodName(),
                    raw.getLineNo(),
                    raw.getMessage()
            );
            event.setTimestampMs(raw.getTimestamp());
            TraceEvent savedEvent = traceRepository.save(event);

            Map<String, TraceResponse.VariableItemDto> varDtoMap = new LinkedHashMap<>();

            for (Map.Entry<String, DebugService.RawVariable> entry : raw.getVariables().entrySet()) {
                String varName = entry.getKey();
                DebugService.RawVariable rv = entry.getValue();

                boolean changed = false;
                if (!lastKnownValues.containsKey(varName)) {
                    changed = true;
                } else if (!Objects.equals(lastKnownValues.get(varName), rv.getValue())) {
                    changed = true;
                }
                lastKnownValues.put(varName, rv.getValue());

                VariableState vs = new VariableState(savedEvent, varName, rv.getValue(), rv.getDataType(), rv.getScope());
                variableStateRepository.save(vs);

                varDtoMap.put(varName, new TraceResponse.VariableItemDto(varName, rv.getValue(), rv.getDataType(), rv.getScope(), changed));
            }

            stepDtos.add(new TraceResponse.StepDto(
                    savedEvent.getId(),
                    savedEvent.getStepNo(),
                    savedEvent.getEventType(),
                    savedEvent.getClassName(),
                    savedEvent.getMethodName(),
                    savedEvent.getLineNo(),
                    savedEvent.getMessage(),
                    savedEvent.getTimestampMs(),
                    varDtoMap
            ));
        }

        return new TraceResponse(analysis.getId(), stepDtos.size(), stepDtos);
    }

    public TraceResponse getTraceByAnalysisId(Long analysisId) {
        List<TraceEvent> events = traceRepository.findByAnalysisIdOrderByStepNoAsc(analysisId);
        List<TraceResponse.StepDto> stepDtos = new ArrayList<>();
        Map<String, String> lastKnownValues = new HashMap<>();

        for (TraceEvent event : events) {
            List<VariableState> vars = variableStateRepository.findByTraceEventId(event.getId());
            Map<String, TraceResponse.VariableItemDto> varMap = new LinkedHashMap<>();

            for (VariableState vs : vars) {
                boolean changed = false;
                if (!lastKnownValues.containsKey(vs.getVariableName()) || !Objects.equals(lastKnownValues.get(vs.getVariableName()), vs.getValue())) {
                    changed = true;
                }
                lastKnownValues.put(vs.getVariableName(), vs.getValue());

                varMap.put(vs.getVariableName(), new TraceResponse.VariableItemDto(
                        vs.getVariableName(),
                        vs.getValue(),
                        vs.getDataType(),
                        vs.getScope(),
                        changed
                ));
            }

            stepDtos.add(new TraceResponse.StepDto(
                    event.getId(),
                    event.getStepNo(),
                    event.getEventType(),
                    event.getClassName(),
                    event.getMethodName(),
                    event.getLineNo(),
                    event.getMessage(),
                    event.getTimestampMs(),
                    varMap
            ));
        }

        return new TraceResponse(analysisId, stepDtos.size(), stepDtos);
    }

    public VariableTimelineResponse getVariableTimeline(Long analysisId) {
        List<TraceEvent> events = traceRepository.findByAnalysisIdOrderByStepNoAsc(analysisId);
        Map<String, List<VariableTimelineResponse.HistoryPoint>> timelineMap = new LinkedHashMap<>();
        Map<String, String> lastKnownValues = new HashMap<>();

        for (TraceEvent event : events) {
            List<VariableState> vars = variableStateRepository.findByTraceEventId(event.getId());
            for (VariableState vs : vars) {
                String varName = vs.getVariableName();
                boolean changed = false;
                if (!lastKnownValues.containsKey(varName) || !Objects.equals(lastKnownValues.get(varName), vs.getValue())) {
                    changed = true;
                }
                lastKnownValues.put(varName, vs.getValue());

                timelineMap.computeIfAbsent(varName, k -> new ArrayList<>())
                        .add(new VariableTimelineResponse.HistoryPoint(
                                event.getStepNo(),
                                event.getLineNo() != null ? event.getLineNo() : 0,
                                vs.getValue(),
                                vs.getDataType(),
                                changed
                        ));
            }
        }

        return new VariableTimelineResponse(analysisId, timelineMap);
    }
}
