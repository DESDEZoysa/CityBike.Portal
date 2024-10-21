import { Component, OnInit, Input } from '@angular/core';
import { Bike } from '../../core/models';
import { BikesService, LoggerService, AppSettings } from '../../services';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ImagePopUpDialog, ImageDetails } from '../../shared/Image-popup/image-popup.component';
import { S3BucketFoldersKeys } from '../../core/enums/S3BucketFoldersKeys';
import { CreateActionPopUpDialog, RepairActionDetails } from '../../shared/repair-action-popup/repair-action-popup';

/** Flat node with expandable and level information */
interface BikePartsFlatNode {
  expandable: boolean;
  partId: number;
  name: string;
  imageUrl: string;
  description: string;
  variant: Variant;
  level: number;
}

/** Bike part data with nested structure.
 * Each node has a name and an optiona list of children. */

interface Part {
  PartId: number;
  Name: string;
  Description?: string;
  ImageUrl?: string;
  Variant: Variant;
}

interface Variant {
  VariantId: number;
  Name: string;
  Description?: string;
  ImageUrl?: string;
}

interface BikePartNode {
  Part: Part;
  Parts?: BikePartNode[];
}

@Component({
  selector: 'app-bike-parts',
  templateUrl: './bike-parts.component.html',
  styleUrls: ['./bike-parts.component.scss']
})

export class BikePartsComponent implements OnInit {
  @Input() bike: Bike;

  isMobile: boolean = false;
  dialogRef: MatDialogRef<ImagePopUpDialog>;
  actionDialogRef: MatDialogRef<CreateActionPopUpDialog>;

  obsDetails: ImageDetails = null;
  actionDetails: RepairActionDetails = null;
  lastCloseResult: string;
  config: MatDialogConfig = {
    disableClose: false,
    width: '55%',
    height: '65%',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: ''
    }
  };

  private _transformer = (node: BikePartNode, level: number) => {
    return {
      expandable: !!node.Parts && node.Parts.length > 0,
      partId: node.Part.PartId,
      name: node.Part.Name,
      imageUrl: node.Part.ImageUrl,
      description: node.Part.Description,
      variant: node.Part.Variant,
      level: level,
    };
  }

  treeControl = new FlatTreeControl<BikePartsFlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.Parts);
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(public dialog: MatDialog, private bikeService: BikesService, private settings: AppSettings, private loggerService: LoggerService) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
  }

  hasChild = (_: number, node: BikePartsFlatNode) => node.expandable;

  ngOnInit() {
    this.getBikePartTreeDetails();
  }

  getBikePartTreeDetails() {
    if (this.bike) {
      this.bikeService.getBikePartTreeDetails(this.bike.BikeId).subscribe(result => {
        this.dataSource.data = result;
      }, error => {
        this.loggerService.showErrorMessage('Getting bike part tree details failed!');
      });
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  openImage(observation: any) {
    let dialogInfo = {
      width: '500', height: '400'
    };

    this.dialogRef = this.dialog.open(ImagePopUpDialog, dialogInfo);

    var url = null;
    if (observation.imageUrl != null) {
      url = this.settings.s3_Image_URL + S3BucketFoldersKeys.Parts + '/' + observation.imageUrl;
    } else {
      url = '/assets/images/no_image_available.svg';
    }

    this.obsDetails = {
      Name: observation.name,
      Url: url,
      Description: observation.description,
    };
    this.dialogRef.componentInstance.details = this.obsDetails;

    this.dialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.dialogRef = null;
      this.obsDetails = null;
    });
  }

  openVariant(observation: any) {
    let dialogInfo = {
      width: '500', height: '400'
    };
    this.dialogRef = this.dialog.open(ImagePopUpDialog, dialogInfo);

    var url = null;
    if (observation.ImageUrl != null) {
      url = this.settings.s3_Image_URL + S3BucketFoldersKeys.Variants + '/' + observation.ImageUrl;
    } else {
      url = '/assets/images/no_image_available.svg';
    }

    this.obsDetails = {
      Name: observation.Name,
      Url: url,
      Description: observation.Description
    };
    this.dialogRef.componentInstance.details = this.obsDetails;

    this.dialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.dialogRef = null;
      this.obsDetails = null;
    });
  }

  openRepairAction(observation: any) {
    let dialogDetails = {
      data: { bikeId: this.bike.BikeId }
    };

    this.actionDialogRef = this.dialog.open(CreateActionPopUpDialog, dialogDetails);
    var variantId = observation.variant != null ? observation.variant.VariantId : 0;
    this.actionDetails = {
      BikeId: this.bike.BikeId,
      PartId: observation.partId,
      VariantId: variantId,
      ReasonId: 0,
      Comments: '',
    };

    this.actionDialogRef.componentInstance.details = this.actionDetails;

    this.actionDialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.actionDialogRef = null;
      this.actionDetails = null;

      // call to 'getBikePartTreeDetails' api to refresh the part tree
      setTimeout(() => {
        this.getBikePartTreeDetails();
      }, 5000);
    });
  }
}
