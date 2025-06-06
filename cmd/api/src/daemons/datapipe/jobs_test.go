// Copyright 2024 Specter Ops, Inc.
//
// Licensed under the Apache License, Version 2.0
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

package datapipe_test

import (
	"context"
	"testing"

	"github.com/specterops/bloodhound/src/daemons/datapipe"
	"github.com/specterops/bloodhound/src/database/mocks"
	"github.com/specterops/bloodhound/src/model"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestHasJobsWaitingForAnalysis(t *testing.T) {
	var (
		mockCtrl = gomock.NewController(t)
		dbMock   = mocks.NewMockDatabase(mockCtrl)
	)

	defer mockCtrl.Finish()

	t.Run("Has Jobs Waiting for Analysis", func(t *testing.T) {
		dbMock.EXPECT().GetIngestJobsWithStatus(gomock.Any(), model.JobStatusAnalyzing).Return([]model.IngestJob{{}}, nil)

		hasJobs, err := datapipe.HasIngestJobsWaitingForAnalysis(context.Background(), dbMock)

		require.True(t, hasJobs)
		require.Nil(t, err)
	})

	t.Run("Has No Jobs Waiting for Analysis", func(t *testing.T) {
		dbMock.EXPECT().GetIngestJobsWithStatus(gomock.Any(), model.JobStatusAnalyzing).Return([]model.IngestJob{}, nil)

		hasJobs, err := datapipe.HasIngestJobsWaitingForAnalysis(context.Background(), dbMock)

		require.False(t, hasJobs)
		require.Nil(t, err)
	})
}

func TestFailAnalyzedIngestJobs(t *testing.T) {
	const jobID int64 = 1

	var (
		mockCtrl = gomock.NewController(t)
		dbMock   = mocks.NewMockDatabase(mockCtrl)
	)

	defer mockCtrl.Finish()

	t.Run("Fail Analyzed Ingest Jobs", func(t *testing.T) {
		dbMock.EXPECT().GetIngestJobsWithStatus(gomock.Any(), model.JobStatusAnalyzing).Return([]model.IngestJob{{
			BigSerial: model.BigSerial{
				ID: jobID,
			},
			Status: model.JobStatusAnalyzing,
		}}, nil)

		dbMock.EXPECT().UpdateIngestJob(gomock.Any(), gomock.Any()).DoAndReturn(func(ctx context.Context, job model.IngestJob) error {
			require.Equal(t, model.JobStatusFailed, job.Status)
			return nil
		})

		datapipe.FailAnalyzedIngestJobs(context.Background(), dbMock)
	})
}

func TestCompleteAnalyzedIngestJobs(t *testing.T) {
	const jobID int64 = 1

	var (
		mockCtrl = gomock.NewController(t)
		dbMock   = mocks.NewMockDatabase(mockCtrl)
	)

	defer mockCtrl.Finish()

	t.Run("Complete Analyzed Ingest Jobs", func(t *testing.T) {
		dbMock.EXPECT().GetIngestJobsWithStatus(gomock.Any(), model.JobStatusAnalyzing).Return([]model.IngestJob{{
			BigSerial: model.BigSerial{
				ID: jobID,
			},
			Status: model.JobStatusAnalyzing,
		}}, nil)

		dbMock.EXPECT().UpdateIngestJob(gomock.Any(), gomock.Any()).DoAndReturn(func(ctx context.Context, IngestJob model.IngestJob) error {
			require.Equal(t, model.JobStatusComplete, IngestJob.Status)
			return nil
		})

		datapipe.CompleteAnalyzedIngestJobs(context.Background(), dbMock)
	})
}

func TestProcessFinishedIngestJobs(t *testing.T) {
	const jobID int64 = 1

	var (
		mockCtrl = gomock.NewController(t)
		dbMock   = mocks.NewMockDatabase(mockCtrl)
	)

	defer mockCtrl.Finish()

	t.Run("Transition Jobs with No Remaining Ingest Tasks", func(t *testing.T) {
		dbMock.EXPECT().GetIngestJobsWithStatus(gomock.Any(), model.JobStatusIngesting).Return([]model.IngestJob{{
			BigSerial: model.BigSerial{
				ID: jobID,
			},
			Status: model.JobStatusIngesting,
		}}, nil)

		dbMock.EXPECT().GetIngestTasksForJob(gomock.Any(), jobID).Return([]model.IngestTask{}, nil)
		dbMock.EXPECT().UpdateIngestJob(gomock.Any(), gomock.Any()).DoAndReturn(func(ctx context.Context, IngestJob model.IngestJob) error {
			require.Equal(t, model.JobStatusAnalyzing, IngestJob.Status)
			return nil
		})

		datapipe.ProcessFinishedIngestJobs(context.Background(), dbMock)
	})

	t.Run("Don't Transition Jobs with Remaining Ingest Tasks", func(t *testing.T) {
		dbMock.EXPECT().GetIngestJobsWithStatus(gomock.Any(), model.JobStatusIngesting).Return([]model.IngestJob{{
			BigSerial: model.BigSerial{
				ID: jobID,
			},
			Status: model.JobStatusIngesting,
		}}, nil)

		dbMock.EXPECT().GetIngestTasksForJob(gomock.Any(), jobID).Return([]model.IngestTask{{}}, nil)

		datapipe.ProcessFinishedIngestJobs(context.Background(), dbMock)
	})
}
